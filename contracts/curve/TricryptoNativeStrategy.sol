// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";

import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";
import "../../tapioca-periph/contracts/interfaces/ISwapper.sol";

import "./interfaces/ITricryptoLPGetter.sol";
import "./interfaces/ITricryptoLPGauge.sol";
import "./interfaces/ICurveMinter.sol";

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

contract TricryptoNativeStrategy is
    BaseERC20Strategy,
    BoringOwnable,
    ReentrancyGuard
{
    using BoringERC20 for IERC20;

    // ************ //
    // *** VARS *** //
    // ************ //
    IERC20 public immutable wrappedNative;
    ISwapper public swapper;

    ITricryptoLPGauge public immutable lpGauge;
    ICurveMinter public immutable minter;
    ITricryptoLPGetter public lpGetter;
    IERC20 public immutable rewardToken; //CRV token

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation to AAVE is performed
    uint256 public depositThreshold;

    bytes public defaultSwapData;

    uint256 private _slippage = 50;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event MultiSwapper(address indexed _old, address indexed _new);
    event DepositThreshold(uint256 _old, uint256 _new);
    event LPGetterSet(address indexed _old, address indexed _new);
    event AmountQueued(uint256 amount);
    event AmountDeposited(uint256 amount);
    event AmountWithdrawn(address indexed to, uint256 amount);

    constructor(
        IYieldBox _yieldBox,
        address _token,
        address _lpGauge,
        address _lpGetter,
        address _minter,
        address _multiSwapper
    ) BaseERC20Strategy(_yieldBox, _token) {
        wrappedNative = IERC20(_token);
        swapper = ISwapper(_multiSwapper);

        lpGauge = ITricryptoLPGauge(_lpGauge);
        minter = ICurveMinter(_minter);
        lpGetter = ITricryptoLPGetter(_lpGetter);
        rewardToken = IERC20(lpGauge.crv_token());

        IERC20(lpGetter.lpToken()).approve(_lpGauge, 0);
        IERC20(lpGetter.lpToken()).approve(_lpGauge, type(uint256).max);
        IERC20(lpGetter.lpToken()).approve(_lpGetter, 0);
        IERC20(lpGetter.lpToken()).approve(_lpGetter, type(uint256).max);
        rewardToken.approve(_multiSwapper, 0);
        rewardToken.approve(_multiSwapper, type(uint256).max);
        wrappedNative.approve(_lpGetter, 0);
        wrappedNative.approve(_lpGetter, type(uint256).max);
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "Curve-Tricrypto-Native";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "Curve-Tricrypto strategy for wrapped native assets";
    }

    /// @notice returns compounded amounts in wrappedNative
    function compoundAmount() public returns (uint256 result) {
        uint256 claimable = lpGauge.claimable_tokens(address(this));
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
        emit MultiSwapper(address(swapper), _swapper);
        rewardToken.approve(address(swapper), 0);
        rewardToken.approve(_swapper, type(uint256).max);
        swapper = ISwapper(_swapper);
    }

    /// @notice Sets the Tricrypto LP Getter
    /// @param _lpGetter the new address
    function setTricryptoLPGetter(address _lpGetter) external onlyOwner {
        emit LPGetterSet(address(lpGetter), _lpGetter);
        wrappedNative.approve(address(lpGetter), 0);
        lpGetter = ITricryptoLPGetter(_lpGetter);
        wrappedNative.approve(_lpGetter, type(uint256).max);
    }

    // ************************ //
    // *** PUBLIC FUNCTIONS *** //
    // ************************ //
    function compound(bytes memory dexData) public {
        uint256 claimable = lpGauge.claimable_tokens(address(this));
        if (claimable > 0) {
            uint256 crvBalanceBefore = rewardToken.balanceOf(address(this));
            minter.mint(address(lpGauge));
            uint256 crvBalanceAfter = rewardToken.balanceOf(address(this));

            if (crvBalanceAfter > crvBalanceBefore) {
                uint256 crvAmount = crvBalanceAfter - crvBalanceBefore;

                ISwapper.SwapData memory swapData = swapper.buildSwapData(
                    address(rewardToken),
                    address(wrappedNative),
                    crvAmount,
                    0,
                    false,
                    false
                );
                uint256 calcAmount = swapper.getOutputAmount(swapData, dexData);
                uint256 minAmount = calcAmount -
                    (calcAmount * _slippage) /
                    10_000; //0.5%
                swapper.swap(swapData, minAmount, address(this), dexData);

                uint256 queued = wrappedNative.balanceOf(address(this));

                _addLiquidityAndStake(queued);
                emit AmountDeposited(queued);
            }
        }
    }

    /// @notice withdraws everythig from the strategy
    function emergencyWithdraw() external onlyOwner returns (uint256 result) {
        compound(defaultSwapData);

        uint256 lpBalance = lpGauge.balanceOf(address(this));
        lpGauge.withdraw(lpBalance, true);
        uint256 calcWithdraw = lpGetter.calcLpToWeth(lpBalance);
        uint256 minAmount = calcWithdraw - (calcWithdraw * 50) / 10_000; //0.5%
        result = lpGetter.removeLiquidityWeth(lpBalance, minAmount);
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //
    /// @dev queries Curve-Tricrypto Liquidity Pool
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 lpBalance = lpGauge.balanceOf(address(this));
        uint256 assetAmount = lpGetter.calcLpToWeth(lpBalance);
        uint256 queued = wrappedNative.balanceOf(address(this));
        // uint256 compoundAmount = compoundAmount();//TODO: not view
        return assetAmount + queued; //+ compoundAmount;
    }

    /// @dev deposits to Curve Tricrypto or queues tokens if the 'depositThreshold' has not been met yet
    function _deposited(uint256 amount) internal override nonReentrant {
        uint256 queued = wrappedNative.balanceOf(address(this));
        if (queued > depositThreshold) {
            _addLiquidityAndStake(queued);
            emit AmountDeposited(queued);
            return;
        }
        emit AmountQueued(amount);
    }

    /// @dev withdraws from Curve Tricrypto
    function _withdraw(
        address to,
        uint256 amount
    ) internal override nonReentrant {
        uint256 available = _currentBalance();
        require(
            available >= amount,
            "TricryptoNativeStrategy: amount not valid"
        );

        uint256 queued = wrappedNative.balanceOf(address(this));
        if (amount > queued) {
            compound(defaultSwapData);
            uint256 lpBalance = lpGauge.balanceOf(address(this));
            lpGauge.withdraw(lpBalance, true);
            uint256 calcWithdraw = lpGetter.calcLpToWeth(lpBalance);
            uint256 minAmount = calcWithdraw - (calcWithdraw * 50) / 10_000; //0.5%
            lpGetter.removeLiquidityWeth(lpBalance, minAmount);
        }
        require(
            wrappedNative.balanceOf(address(this)) >= amount,
            "TricryptoNativeStrategy: not enough"
        );
        wrappedNative.safeTransfer(to, amount);
        queued = wrappedNative.balanceOf(address(this));
        if (queued > 0) {
            _addLiquidityAndStake(queued);
        }
        emit AmountWithdrawn(to, amount);
    }

    function _addLiquidityAndStake(uint256 amount) private {
        uint256 calcAmount = lpGetter.calcWethToLp(amount);
        uint256 minAmount = calcAmount - (calcAmount * 50) / 10_000; //0.5%
        uint256 lpAmount = lpGetter.addLiquidityWeth(amount, minAmount);
        lpGauge.deposit(lpAmount, address(this), false);
    }
}
