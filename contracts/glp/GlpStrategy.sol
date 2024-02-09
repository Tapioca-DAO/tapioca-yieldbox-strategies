// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";
import "tapioca-sdk/dist/contracts/YieldBox/contracts/enums/YieldBoxTokenType.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../../tapioca-periph/contracts/interfaces/IOracle.sol";
import "../interfaces/gmx/IGmxRewardDistributor.sol";
import "../interfaces/gmx/IGmxRewardTracker.sol";
import "../interfaces/gmx/IGmxRewardRouter.sol";
import "../interfaces/gmx/IGlpManager.sol";
import "../interfaces/gmx/IGmxVester.sol";
import "../interfaces/gmx/IGmxVault.sol";
import "../feeCollector.sol";

// NOTE: Specific to a UniV3 pool!! This will not work on Avalanche!
contract GlpStrategy is
    BaseERC20Strategy,
    BoringOwnable,
    IFeeCollector,
    FeeCollector
{
    using BoringERC20 for IERC20;

    // *********************************** //
    /* ============ STATE ============ */
    // *********************************** //

    IERC20 private immutable gmx;
    IERC20 private immutable weth;

    IGmxRewardTracker private immutable sbfGMX;
    IGlpManager private immutable glpManager;
    IGmxRewardRouterV2 private immutable glpRewardRouter;
    IGmxRewardRouterV2 private immutable gmxRewardRouter;
    IGmxVester private immutable glpVester;
    IGmxRewardTracker private immutable fsGLP;
    IGmxRewardTracker private immutable sGMX;

    bool public paused;

    IOracle public wethGlpOracle;
    bytes public wethGlpOracleData;

    uint256 private _slippage = 50;
    uint256 private constant _MAX_SLIPPAGE = 10000;

    // Buy or not GLP on deposits/withdrawal
    bool shouldBuyGLP = true;

    event SlippageUpdated(uint256 indexed oldVal, uint256 indexed newVal);

    // *********************************** //
    /* ============ ERROR ============ */
    // *********************************** //

    error WethMismatch();
    error GlpRewardRouterNotValid();
    error GmxRewardRouterNotValid();
    error NotAuthorized();
    error NotValid();
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
    ) BaseERC20Strategy(_yieldBox, address(_sGlp)) FeeCollector(owner, 100) {
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

        wethGlpOracle = _wethGlpOracle;
        wethGlpOracleData = _wethGlpOracleData;

        owner = _owner;
    }

    // *********************************** //
    /* ============ VIEW ============ */
    // *********************************** //

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

    // *********************************** //
    /* ============ EXTERNAL ============ */
    // *********************************** //

    /// @notice Claim sGLP reward and reinvest
    function harvest() public {
        _claimRewards();
        if (shouldBuyGLP) {
            _buyGlp();
        }
    }

    /// @notice Withdraws the fees from the strategy
    function withdrawFees(uint256 amount) external {
        uint256 feeAmount = feesPending;
        if (feeAmount > 0) {
            uint256 wethAmount = weth.balanceOf(address(this));
            if (wethAmount < amount) {
                amount = wethAmount;
            }
            weth.safeTransfer(feeRecipient, amount);
            feesPending -= amount;
        }
    }

    // *********************************** //
    /* ============ OWNER ============ */
    // *********************************** //

    /// @notice sets the slippage used in swap operations
    /// @param _val the new slippage amount
    function setSlippage(uint256 _val) external onlyOwner {
        if (_val > _MAX_SLIPPAGE) revert NotValid();
        emit SlippageUpdated(_slippage, _val);
        _slippage = _val;
    }

    /// @notice updates the pause state
    /// @param _val the new state
    function updatePaused(bool _val) external onlyOwner {
        paused = _val;
    }

    function updateFeeRecipient(address recipient) external onlyOwner {
        feeRecipient = recipient;
    }

    /// @notice sets the buyGLP flag
    function setBuyGLP(bool _val) external onlyOwner {
        shouldBuyGLP = _val;
    }

    // *********************************** //
    /* ============ INTERNAL ============ */
    // *********************************** //

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
        if (shouldBuyGLP) {
            _buyGlp(); // Buy GLP with WETH rewards
        }
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

            _safeApprove(address(weth), address(glpManager), wethAmount);
            glpRewardRouter.mintAndStakeGlp(
                address(weth),
                wethAmount,
                0,
                amountInGlp
            );
        }
    }

    function _safeApprove(address token, address to, uint256 value) internal {
        require(token.code.length > 0, "GlpStrategy::safeApprove: no contract");
        bool success;
        bytes memory data;
        (success, data) = token.call(abi.encodeCall(IERC20.approve, (to, 0)));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "GlpStrategy::safeApprove: approve failed"
        );

        (success, data) = token.call(
            abi.encodeCall(IERC20.approve, (to, value))
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "GlpStrategy::safeApprove: approve failed"
        );
    }
}
