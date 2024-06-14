// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Tapioca
import {ISavingsDai} from "tapioca-periph/interfaces/external/makerdao/ISavingsDai.sol";
import {BaseERC20Strategy} from "yieldbox/strategies/BaseStrategy.sol";
import {ICluster} from "tapioca-periph/interfaces/periph/ICluster.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";
import {ITDai} from "./interfaces/ITDai.sol";

/*
████████╗ █████╗ ██████╗ ██╗ ██████╗  ██████╗ █████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██╔═══██╗██╔════╝██╔══██╗
   ██║   ███████║██████╔╝██║██║   ██║██║     ███████║
   ██║   ██╔══██║██╔═══╝ ██║██║   ██║██║     ██╔══██║
   ██║   ██║  ██║██║     ██║╚██████╔╝╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
*/

contract sDaiStrategy is BaseERC20Strategy, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation is performed
    uint256 public depositThreshold;

    ISavingsDai public immutable sDai;
    IERC20 public immutable dai;
    ICluster internal cluster;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event DepositThreshold(uint256 indexed _old, uint256 indexed _new);
    event AmountQueued(uint256 indexed amount);
    event AmountDeposited(uint256 indexed amount);
    event AmountWithdrawn(address indexed to, uint256 indexed amount);
    event ClusterUpdated(ICluster indexed oldCluster, ICluster indexed newCluster);

    // ************** //
    // *** ERRORS *** //
    // ************** //
    error TokenNotValid();
    error TransferFailed();
    error NotEnough();
    error PauserNotAuthorized();
    error EmptyAddress();

    constructor(IYieldBox _yieldBox, address _token, ISavingsDai _sDai, address _owner)
        BaseERC20Strategy(_yieldBox, _token)
    {
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
    function harvestable() external view returns (uint256 result) {
        return sDai.maxWithdraw(address(this));
    }

    // *********************** //
    // *** OWNER FUNCTIONS *** //
    // *********************** //

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
        _pause();

        // Withdraw from the pool, convert to Dai and wrap it into tDai
        uint256 maxWithdraw = sDai.maxWithdraw(address(this));
        sDai.withdraw(maxWithdraw, address(this), address(this));
        dai.approve(contractAddress, maxWithdraw);
        ITDai(contractAddress).wrap(address(this), address(this), maxWithdraw);
    }

    /**
     * @notice Un/Pauses this contract.
    */
    function setPause(bool _pauseState) external {
        if (!cluster.hasRole(msg.sender, keccak256("PAUSABLE")) && msg.sender != owner()) revert PauserNotAuthorized();
        if (_pauseState) {
            _pause();
        } else {
            _unpause();
        }
    }

 
    /**
     * @notice updates the Cluster address.
     * @dev can only be called by the owner.
     * @param _cluster the new address.
     */
    function setCluster(ICluster _cluster) external onlyOwner {
        if (address(_cluster) == address(0)) revert EmptyAddress();
        emit ClusterUpdated(cluster, _cluster);
        cluster = _cluster;
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //

    /// @notice Returns the amount of DAI in the pool plus the amount that can be withdrawn from the contract
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 maxWithdraw = sDai.maxWithdraw(address(this));
        uint256 queued = IERC20(contractAddress).balanceOf(address(this)); //tDai
        return maxWithdraw + queued;
    }

    /// @dev deposits to SavingsDai or queues tokens if the 'depositThreshold' has not been met yet
    function _deposited(uint256 amount) internal override whenNotPaused nonReentrant {
        // Assume that YieldBox already transferred the tokens to this address
        uint256 queued = IERC20(contractAddress).balanceOf(address(this));

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
    function _withdraw(address to, uint256 amount) internal whenNotPaused override nonReentrant {
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

    receive() external payable {}
}
