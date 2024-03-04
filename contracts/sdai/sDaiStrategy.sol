// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Tapioca
import {ISavingsDai} from "tapioca-periph/interfaces/external/makerdao/ISavingsDai.sol";
import {BaseERC20Strategy} from "tap-yieldbox/strategies/BaseStrategy.sol";
import {FeeCollector, IFeeCollector} from "../feeCollector.sol";
import {IYieldBox} from "tap-yieldbox/interfaces/IYieldBox.sol";
import {ITDai} from "./interfaces/ITDai.sol";

/*
████████╗ █████╗ ██████╗ ██╗ ██████╗  ██████╗ █████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██╔═══██╗██╔════╝██╔══██╗
   ██║   ███████║██████╔╝██║██║   ██║██║     ███████║
   ██║   ██╔══██║██╔═══╝ ██║██║   ██║██║     ██╔══██║
   ██║   ██║  ██║██║     ██║╚██████╔╝╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
*/

contract sDaiStrategy is BaseERC20Strategy, Ownable, ReentrancyGuard, FeeCollector, IFeeCollector {
    using SafeERC20 for IERC20;

    /// @notice Keeps track of the total active deposits, goes up when a deposit is made and down when a withdrawal is made
    uint256 public totalActiveDeposits;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation is performed
    uint256 public depositThreshold;

    ISavingsDai public immutable sDai;
    IERC20 public immutable dai;
    bool public paused;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event DepositThreshold(uint256 indexed _old, uint256 indexed _new);
    event AmountQueued(uint256 indexed amount);
    event AmountDeposited(uint256 indexed amount);
    event AmountWithdrawn(address indexed to, uint256 indexed amount);

    // ************** //
    // *** ERRORS *** //
    // ************** //
    error TokenNotValid();
    error TransferFailed();
    error Paused();
    error NotEnough();

    constructor(
        IYieldBox _yieldBox,
        address _token,
        ISavingsDai _sDai,
        address _feeRecipient,
        uint256 _feeBps,
        address _owner
    ) BaseERC20Strategy(_yieldBox, _token) FeeCollector(_feeRecipient, _feeBps) {
        sDai = _sDai;
        dai = IERC20(ITDai(_token).erc20());
        if (address(dai) != sDai.dai()) revert TokenNotValid();

        transferOwnership(_owner);
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "sDai";
    }

    /// @notice Returns the description of this strategy
    function description() external pure override returns (string memory description_) {
        return "sDai strategy for tDai assets";
    }

    /// @notice Returns the unharvested token gains
    function harvestable() external view returns (uint256 result, uint256 fees) {
        (fees, result) = _computePendingFees(totalActiveDeposits, sDai.maxWithdraw(address(this)));
    }

    // *********************** //
    // *** OWNER FUNCTIONS *** //
    // *********************** //
    /// @notice updates fee recipient
    /// @param _val fee address
    function updateFeeRecipient(address _val) external onlyOwner {
        feeRecipient = _val;
    }

    /// @notice updates the pause state
    /// @param _val the new state
    function updatePaused(bool _val) external onlyOwner {
        paused = _val;
    }

    /// @notice rescues unused ETH from the contract
    /// @param amount the amount to rescue
    /// @param to the recipient
    function rescueEth(uint256 amount, address to) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Sets the deposit threshold
    /// @param amount The new threshold amount
    function setDepositThreshold(uint256 amount) external onlyOwner {
        emit DepositThreshold(depositThreshold, amount);
        depositThreshold = amount;
    }

    /// @notice withdraws everything from the strategy
    /// @dev Withdraws everything from the strategy and pauses it
    function emergencyWithdraw() external onlyOwner {
        paused = true; // Pause the strategy

        // Withdraw from the pool, convert to Dai and wrap it into tDai
        uint256 maxWithdraw = sDai.maxWithdraw(address(this));
        sDai.withdraw(maxWithdraw, address(this), address(this));
        dai.approve(contractAddress, maxWithdraw);
        ITDai(contractAddress).wrap(address(this), address(this), maxWithdraw);
    }

    /// @notice withdraws fees
    /// @dev Withdraws the fees from the strategy. Does not withdraw from contract's balance like `_withdraw` does.
    /// @param _amount Amount to withdraw
    function withdrawFees(uint256 _amount) external onlyOwner {
        feesPending -= _amount;

        // Withdraw from the pool, convert to Dai and wrap it into tDai
        sDai.withdraw(_amount, address(this), address(this));
        dai.approve(contractAddress, _amount);
        ITDai(contractAddress).wrap(address(this), address(this), _amount);
        IERC20(contractAddress).safeTransfer(feeRecipient, _amount);
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //

    /// @notice Returns the amount of DAI in the pool plus the amount that can be withdrawn from the contract, minus the pending fees
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 maxWithdraw = sDai.maxWithdraw(address(this));
        uint256 queued = IERC20(contractAddress).balanceOf(address(this)); //tDai
        return queued + maxWithdraw - feesPending; //this operation is valid because dai <> tDai ratio is 1:1
    }

    /// @dev deposits to SavingsDai or queues tokens if the 'depositThreshold' has not been met yet
    function _deposited(uint256 amount) internal override nonReentrant {
        if (paused) revert Paused();

        // Assume that YieldBox already transferred the tokens to this address
        uint256 queued = IERC20(contractAddress).balanceOf(address(this));
        totalActiveDeposits += queued; // Update total deposits

        if (queued >= depositThreshold) {
            ITDai(contractAddress).unwrap(address(this), queued);
            dai.approve(address(sDai), queued);
            sDai.deposit(queued, address(this));
            emit AmountDeposited(queued);
            return;
        }
        emit AmountQueued(amount);
    }

    /// @dev burns sDai in exchange of Dai and wraps it into tDai
    function _withdraw(address to, uint256 amount) internal override nonReentrant {
        if (paused) revert Paused();

        uint256 maxWithdraw = sDai.maxWithdraw(address(this)); // Total amount of Dai that can be withdrawn from the pool
        uint256 assetInContract = IERC20(contractAddress).balanceOf(address(this));

        // Can't realistically overflow. Units are in DAI, values are not externally passed.
        unchecked {
            if (assetInContract + maxWithdraw < amount) revert NotEnough(); // dai <> tDai is 1:1, units are the same
        }

        uint256 toWithdrawFromPool;
        // Amount externally passed, but is already checked to be in realistic boundaries.
        unchecked {
            toWithdrawFromPool = amount > assetInContract ? amount - assetInContract : 0; // Asset to withdraw from the pool if not enough available in the contract
        }

        // Compute the fees
        {
            uint256 _totalActiveDeposits = totalActiveDeposits; // Cache total deposits
            (uint256 fees, uint256 accumulatedTokens) = _computePendingFees(_totalActiveDeposits, maxWithdraw); // Compute pending fees
            if (fees > 0) {
                feesPending += fees; // Update pending fees
            }

            // Act as an invariant, totalActiveDeposits should never be lower than the amount to withdraw from the pool
            totalActiveDeposits = _totalActiveDeposits + accumulatedTokens - amount; // Update total deposits
        }

        // If there is nothing to withdraw from the pool, just transfer the tokens and return
        if (toWithdrawFromPool == 0) {
            IERC20(contractAddress).safeTransfer(to, amount);
            emit AmountWithdrawn(to, amount);
            return;
        }

        // Withdraw from the pool, convert to Dai and wrap it into tDai
        sDai.withdraw(toWithdrawFromPool, address(this), address(this));
        dai.approve(contractAddress, toWithdrawFromPool);
        ITDai(contractAddress).wrap(address(this), address(this), toWithdrawFromPool);

        // Transfer the requested amount
        IERC20(contractAddress).safeTransfer(to, amount);
        emit AmountWithdrawn(to, amount);
    }

    /// @notice Computes the pending fees
    /// @param _totalDeposited Total amount deposited to this contract, from T0...Tn
    /// @param _amountInPool Total amount available in the pool
    /// @return result The amount of fees to be processed
    /// @return accumulated The amount of new tokens accumulated
    function _computePendingFees(uint256 _totalDeposited, uint256 _amountInPool)
        internal
        view
        returns (uint256 result, uint256 accumulated)
    {
        if (_amountInPool > _totalDeposited) {
            accumulated = _amountInPool - _totalDeposited; // Get the occurred gains amount
            (, result) = _processFees(accumulated); // Process fees
        }
    }

    receive() external payable {}
}
