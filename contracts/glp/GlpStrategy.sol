// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
pragma experimental ABIEncoderV2;

import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

import "tapioca-sdk/dist/contracts/YieldBox/contracts/enums/YieldBoxTokenType.sol";
import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";

import "../interfaces/IFeeCollector.sol";
import "../interfaces/gmx/IGlpManager.sol";
import "../interfaces/gmx/IGmxRewardDistributor.sol";
import "../interfaces/gmx/IGmxRewardRouter.sol";
import "../interfaces/gmx/IGmxRewardTracker.sol";
import "../interfaces/gmx/IGmxVester.sol";
import "../interfaces/gmx/IGmxVault.sol";
import "../../tapioca-periph/contracts/interfaces/IOracle.sol";

// NOTE: Specific to a UniV3 pool!! This will not work on Avalanche!
contract GlpStrategy is BaseERC20Strategy, BoringOwnable {
    using BoringERC20 for IERC20;

    IERC20 private immutable gmx;
    IERC20 private immutable weth;

    IGmxRewardTracker private immutable sbfGMX;
    IGlpManager private immutable glpManager;
    IGmxRewardRouterV2 private immutable glpRewardRouter;
    IGmxRewardRouterV2 private immutable gmxRewardRouter;
    IGmxVester private immutable glpVester;
    IGmxRewardTracker private immutable fsGLP;
    IGmxRewardTracker private immutable sGMX;

    uint256 internal constant FEE_BPS = 100;
    address public feeRecipient;
    uint256 public feesPending;

    bool public paused;

    IOracle public wethGlpOracle;
    bytes public wethGlpOracleData;

    uint256 private _slippage = 50;

    error WethMismatch();
    error GlpRewardRouterNotValid();
    error GmxRewardRouterNotValid();
    error NotAuthorized();
    error NotValid();
    error NotEnough();
    error Failed();
    error Paused();

    constructor(
        IYieldBox _yieldBox,
        IGmxRewardRouterV2 _gmxRewardRouter,
        IGmxRewardRouterV2 _glpRewardRouter,
        IERC20 _sGlp,
        IOracle _wethGlpOracle,
        bytes memory _wethGlpOracleData,
        address _owner
    ) BaseERC20Strategy(_yieldBox, address(_sGlp)) {
        weth = IERC20(_yieldBox.wrappedNative());
        if (address(weth) != _gmxRewardRouter.weth()) revert WethMismatch();

        if (_glpRewardRouter.gmx() != address(0))
            revert GlpRewardRouterNotValid();
        glpRewardRouter = _glpRewardRouter;

        address _gmx = _gmxRewardRouter.gmx();
        if (_gmx == address(0)) revert GmxRewardRouterNotValid();
        gmxRewardRouter = _gmxRewardRouter;
        gmx = IERC20(_gmx);

        fsGLP = IGmxRewardTracker(glpRewardRouter.stakedGlpTracker());
        sGMX = IGmxRewardTracker(gmxRewardRouter.stakedGmxTracker());
        sbfGMX = IGmxRewardTracker(gmxRewardRouter.feeGmxTracker());
        glpManager = IGlpManager(glpRewardRouter.glpManager());
        glpVester = IGmxVester(gmxRewardRouter.glpVester());

        feeRecipient = owner;

        wethGlpOracle = _wethGlpOracle;
        wethGlpOracleData = _wethGlpOracleData;

        owner = _owner;
    }

    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "sGLP";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "Holds staked GLP tokens and compounds the rewards";
    }

    /// @notice Returns The estimate the pending GLP.
    /// @dev Doesn't revert because we want to still check current balance in `_currentBalance()`
    /// @return amount The amount of GLP that should be received
    function pendingRewards() public view returns (uint256 amount) {
        uint256 wethAmount = weth.balanceOf(address(this));
        uint256 _feesPending = feesPending;
        if (wethAmount > _feesPending) {
            wethAmount -= _feesPending;
            uint256 fee = (wethAmount * FEE_BPS) / 10_000;
            wethAmount -= fee;

            uint256 glpPrice;
            (, glpPrice) = wethGlpOracle.peek(wethGlpOracleData);

            uint256 amountInGlp = (wethAmount * glpPrice) / 1e18;
            amount = amountInGlp - (amountInGlp * _slippage) / 10_000; //0.5%
        }
    }

    /// @notice Claim sGLP reward and reinvest
    function harvest() public {
        _claimRewards();
        _buyGlp();
    }

    /// @notice sets the slippage used in swap operations
    /// @param _val the new slippage amount
    function setSlippage(uint256 _val) external onlyOwner {
        _slippage = _val;
    }

    /// @notice updates the pause state
    /// @param _val the new state
    function updatePaused(bool _val) external onlyOwner {
        paused = _val;
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        feeRecipient = recipient;
    }

    /// @notice Withdraws the fees from the strategy
    function withdrawFees() external {
        uint256 feeAmount = feesPending;
        if (feeAmount > 0) {
            uint256 wethAmount = weth.balanceOf(address(this));
            if (wethAmount < feeAmount) {
                feeAmount = wethAmount;
            }
            weth.safeTransfer(feeRecipient, feeAmount);
            feesPending -= feeAmount;
        }
    }

    /// @notice Returns the amount of sGLP staked in the strategy
    function _currentBalance() internal view override returns (uint256 amount) {
        amount = IERC20(contractAddress).balanceOf(address(this));
        amount += pendingRewards();
    }

    function _deposited(uint256 /* amount */) internal override {
        if (paused) revert Paused();
        harvest();
    }

    /// @notice Withdraws the specified amount from the strategy
    function _withdraw(address to, uint256 amount) internal override {
        if (amount == 0) revert NotValid();
        _claimRewards(); // Claim rewards before withdrawing
        _buyGlp(); // Buy with the rewards
        IERC20(contractAddress).safeTransfer(to, amount); // Transfer the tokens
    }

    /// @notice Claim GMX rewards, only in WETH.
    function _claimRewards() private {
        gmxRewardRouter.handleRewards({
            _shouldClaimGmx: false,
            _shouldStakeGmx: false,
            _shouldClaimEsGmx: false,
            _shouldStakeEsGmx: false,
            _shouldStakeMultiplierPoints: false,
            _shouldClaimWeth: true,
            _shouldConvertWethToEth: false
        });
    }

    /// @notice Buy GLP with WETH rewards.
    function _buyGlp() private {
        uint256 wethAmount = weth.balanceOf(address(this));
        uint256 _feesPending = feesPending;
        if (wethAmount > _feesPending) {
            wethAmount -= _feesPending;
            uint256 fee = (wethAmount * FEE_BPS) / 10_000;
            feesPending = _feesPending + fee;
            wethAmount -= fee;

            bool success;
            uint256 glpPrice;

            (success, glpPrice) = wethGlpOracle.get(wethGlpOracleData);
            if (!success) revert Failed();
            uint256 amountInGlp = (wethAmount * glpPrice) / 1e18;
            amountInGlp = amountInGlp - (amountInGlp * _slippage) / 10_000; //0.5%

            weth.approve(address(glpManager), 0);
            weth.approve(address(glpManager), wethAmount);
            glpRewardRouter.mintAndStakeGlp(
                address(weth),
                wethAmount,
                0,
                amountInGlp
            );
        }
    }
}
