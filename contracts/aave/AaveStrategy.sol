// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";

import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";
import "../../tapioca-periph/contracts/interfaces/ISwapper.sol";
import "./interfaces/IStkAave.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IIncentivesController.sol";

/*
__/\\\\\\\\\\\\\\\_____/\\\\\\\\\_____/\\\\\\\\\\\\\____/\\\\\\\\\\\_______/\\\\\_____________/\\\\\\\\\_____/\\\\\\\\\____        
 _\///////\\\/////____/\\\\\\\\\\\\\__\/\\\/////////\\\_\/////\\\///______/\\\///\\\________/\\\////////____/\\\\\\\\\\\\\__       
  _______\/\\\________/\\\/////////\\\_\/\\\_______\/\\\_____\/\\\_______/\\\/__\///\\\____/\\\/____________/\\\/////////\\\_      
   _______\/\\\_______\/\\\_______\/\\\_\/\\\\\\\\\\\\\/______\/\\\______/\\\______\//\\\__/\\\_____________\/\\\_______\/\\\_     
    _______\/\\\_______\/\\\\\\\\\\\\\\\_\/\\\/////////________\/\\\_____\/\\\_______\/\\\_\/\\\_____________\/\\\\\\\\\\\\\\\_    
     _______\/\\\_______\/\\\/////////\\\_\/\\\_________________\/\\\_____\//\\\______/\\\__\//\\\____________\/\\\/////////\\\_   
      _______\/\\\_______\/\\\_______\/\\\_\/\\\_________________\/\\\______\///\\\__/\\\_____\///\\\__________\/\\\_______\/\\\_  
       _______\/\\\_______\/\\\_______\/\\\_\/\\\______________/\\\\\\\\\\\____\///\\\\\/________\////\\\\\\\\\_\/\\\_______\/\\\_ 
        _______\///________\///________\///__\///______________\///////////_______\/////_____________\/////////__\///________\///__
*/

//Wrapped-native strategy for AAVE
contract AaveStrategy is BaseERC20Strategy, BoringOwnable, ReentrancyGuard {
    using BoringERC20 for IERC20;

    // ************ //
    // *** VARS *** //
    // ************ //
    IERC20 public immutable wrappedNative;
    ISwapper public swapper;

    //AAVE
    IStkAave public immutable stakedRewardToken;
    IERC20 public immutable rewardToken;
    IERC20 public immutable receiptToken;
    ILendingPool public immutable lendingPool;
    IIncentivesController public immutable incentivesController;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation to AAVE is performed
    uint256 public depositThreshold;

    bytes public defaultSwapData;

    bool public paused;

    uint256 private _slippage = 50;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event MultiSwapper(address indexed _old, address indexed _new);
    event DepositThreshold(uint256 _old, uint256 _new);
    event AmountQueued(uint256 amount);
    event AmountDeposited(uint256 amount);
    event AmountWithdrawn(address indexed to, uint256 amount);

    constructor(
        IYieldBox _yieldBox,
        address _token,
        address _lendingPool,
        address _incentivesController,
        address _receiptToken,
        address _multiSwapper
    ) BaseERC20Strategy(_yieldBox, _token) {
        wrappedNative = IERC20(_token);
        swapper = ISwapper(_multiSwapper);

        lendingPool = ILendingPool(_lendingPool);
        incentivesController = IIncentivesController(_incentivesController);
        stakedRewardToken = IStkAave(incentivesController.REWARD_TOKEN());
        rewardToken = IERC20(stakedRewardToken.REWARD_TOKEN());
        receiptToken = IERC20(_receiptToken);

        wrappedNative.approve(_lendingPool, 0);
        wrappedNative.approve(_lendingPool, type(uint256).max);
        rewardToken.approve(_multiSwapper, 0);
        rewardToken.approve(_multiSwapper, type(uint256).max);
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "AAVE";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "AAVE strategy for wrapped native assets";
    }

    /// @notice returns compounded amounts in wrappedNative
    function compoundAmount() public view returns (uint256 result) {
        uint256 claimable = stakedRewardToken.stakerRewardsToClaim(
            address(this)
        );
        result = 0;
        if (claimable > 0) {
            ISwapper.SwapData memory swapData = swapper.buildSwapData(
                address(rewardToken),
                address(wrappedNative),
                claimable,
                0,
                false,
                false
            );
            result = swapper.getOutputAmount(swapData, defaultSwapData);
            result = result - (result * _slippage) / 10_000; //0.5%
        }
    }

    // *********************** //
    // *** OWNER FUNCTIONS *** //
    // *********************** //
    /// @notice updates the pause state
    /// @param _val the new state
    function updatePaused(bool _val) external onlyOwner {
        paused = _val;
    }

    /// @notice sets the default swap data
    /// @param _data the new data
    function setDefaultSwapData(bytes calldata _data) external onlyOwner {
        defaultSwapData = _data;
    }

    /// @notice sets the slippage used in swap operations
    /// @param _val the new slippage amount
    function setSlippage(uint256 _val) external onlyOwner {
        _slippage = _val;
    }

    /// @notice Sets the deposit threshold
    /// @param amount The new threshold amount
    function setDepositThreshold(uint256 amount) external onlyOwner {
        emit DepositThreshold(depositThreshold, amount);
        depositThreshold = amount;
    }

    /// @notice Sets the Swapper address
    /// @param _swapper The new swapper address
    function setMultiSwapper(address _swapper) external onlyOwner {
        rewardToken.approve(address(swapper), 0);

        emit MultiSwapper(address(swapper), _swapper);
        swapper = ISwapper(_swapper);

        rewardToken.approve(_swapper, 0);
        rewardToken.approve(_swapper, type(uint256).max);
    }

    // ************************ //
    // *** PUBLIC FUNCTIONS *** //
    // ************************ //
    /// @notice
    function compound(bytes memory dexData) external {
        //first claim stkAave
        uint256 unclaimedStkAave = incentivesController.getUserUnclaimedRewards(
            address(this)
        );

        if (unclaimedStkAave > 0) {
            address[] memory tokens = new address[](1);
            tokens[0] = address(receiptToken);
            incentivesController.claimRewards(
                tokens,
                type(uint256).max,
                address(this)
            );
        }
        //try to claim AAVE
        uint256 claimable = stakedRewardToken.stakerRewardsToClaim(
            address(this)
        );
        if (claimable > 0) {
            stakedRewardToken.claimRewards(address(this), claimable);
        }

        //try to cooldown
        (uint40 currentCooldown, ) = stakedRewardToken.stakersCooldowns(
            address(this)
        );

        uint256 balanceOfStkAave = stakedRewardToken.balanceOf(address(this));
        if (currentCooldown > 0) {
            //we have an active cooldown; check if we need to cooldown again
            bool daysPassed = (currentCooldown +
                stakedRewardToken.COOLDOWN_SECONDS() +
                stakedRewardToken.UNSTAKE_WINDOW()) < block.timestamp;
            if (daysPassed && balanceOfStkAave > 0) {
                stakedRewardToken.cooldown();
            }
        } else if (balanceOfStkAave > 0) {
            stakedRewardToken.cooldown();
        }

        //try to stake
        uint256 aaveBalanceAfter = rewardToken.balanceOf(address(this));
        if (aaveBalanceAfter > 0) {
            //swap AAVE to wrappedNative
            ISwapper.SwapData memory swapData = swapper.buildSwapData(
                address(rewardToken),
                address(wrappedNative),
                aaveBalanceAfter,
                0,
                false,
                false
            );
            uint256 calcAmount = swapper.getOutputAmount(swapData, dexData);
            uint256 minAmount = calcAmount - (calcAmount * _slippage) / 10_000; //0.5%
            swapper.swap(swapData, minAmount, address(this), dexData);

            //stake if > depositThreshold
            uint256 queued = wrappedNative.balanceOf(address(this));
            if (queued > depositThreshold) {
                lendingPool.deposit(
                    address(wrappedNative),
                    queued,
                    address(this),
                    0
                );
            }
            emit AmountDeposited(queued);
        }
    }

    /// @notice withdraws everythig from the strategy
    function emergencyWithdraw() external onlyOwner returns (uint256 result) {
        try AaveStrategy(address(this)).compound(defaultSwapData) {} catch (
            bytes memory
        ) {}
        (uint256 toWithdraw, , , , , ) = lendingPool.getUserAccountData(
            address(this)
        );
        result = lendingPool.withdraw(
            address(wrappedNative),
            toWithdraw,
            address(this)
        );

        paused = true;
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //
    /// @dev queries 'getUserAccountData' from AAVE and gets the total collateral
    function _currentBalance() internal view override returns (uint256 amount) {
        (amount, , , , , ) = lendingPool.getUserAccountData(address(this));
        uint256 queued = wrappedNative.balanceOf(address(this));
        uint256 claimableRewards = compoundAmount();
        return amount + queued + claimableRewards;
    }

    /// @dev deposits to AAVE or queues tokens if the 'depositThreshold' has not been met yet
    ///      - when depositing to AAVE, aToken is minted to this contract
    function _deposited(uint256 amount) internal override nonReentrant {
        require(!paused, "Stargate: paused");
        uint256 queued = wrappedNative.balanceOf(address(this));
        if (queued > depositThreshold) {
            lendingPool.deposit(
                address(wrappedNative),
                queued,
                address(this),
                0
            );
            emit AmountDeposited(queued);
            return;
        }
        emit AmountQueued(amount);
    }

    /// @dev burns aToken in exchange of Token and withdraws from AAVE LendingPool
    function _withdraw(
        address to,
        uint256 amount
    ) internal override nonReentrant {
        uint256 available = _currentBalance();
        require(available >= amount, "AaveStrategy: amount not valid");

        uint256 queued = wrappedNative.balanceOf(address(this));
        if (amount > queued) {
            try AaveStrategy(address(this)).compound(defaultSwapData) {} catch (
                bytes memory
            ) {}

            queued = wrappedNative.balanceOf(address(this));
            uint256 toWithdraw = amount - queued;

            uint256 obtainedWrapped = lendingPool.withdraw(
                address(wrappedNative),
                toWithdraw,
                address(this)
            );
            if (obtainedWrapped > toWithdraw) {
                amount += (obtainedWrapped - toWithdraw);
            }
        }

        wrappedNative.safeTransfer(to, amount);
        emit AmountWithdrawn(to, amount);
    }
}
