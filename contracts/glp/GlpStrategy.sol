// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Tapioca
import {IGmxRewardRouterV2} from "tapioca-strategies/interfaces/gmx/IGmxRewardRouter.sol";
import {IGmxRewardTracker} from "tapioca-strategies/interfaces/gmx/IGmxRewardTracker.sol";
import {ITapiocaOracle} from "tapioca-periph/interfaces/periph/ITapiocaOracle.sol";
import {IGlpManager} from "tapioca-strategies/interfaces/gmx/IGlpManager.sol";
import {IGmxVester} from "tapioca-strategies/interfaces/gmx/IGmxVester.sol";
import {BaseERC20Strategy} from "yieldbox/strategies/BaseStrategy.sol";
import {ICluster} from "tapioca-periph/interfaces/periph/ICluster.sol";
import {ITOFT} from "tapioca-periph/interfaces/oft/ITOFT.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";

/*
████████╗ █████╗ ██████╗ ██╗ ██████╗  ██████╗ █████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██╔═══██╗██╔════╝██╔══██╗
   ██║   ███████║██████╔╝██║██║   ██║██║     ███████║
   ██║   ██╔══██║██╔═══╝ ██║██║   ██║██║     ██╔══██║
   ██║   ██║  ██║██║     ██║╚██████╔╝╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
*/

contract GlpStrategy is BaseERC20Strategy, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // *********************************** //
    /* ============ STATE ============ */
    // *********************************** //

    IERC20 private immutable sGLP;
    IERC20 private immutable gmx;
    IERC20 private immutable weth;

    IGmxRewardRouterV2 private immutable glpRewardRouter;
    IGmxRewardRouterV2 private immutable gmxRewardRouter;
    IGmxRewardTracker private immutable sbfGMX;
    IGmxRewardTracker private immutable fGLP;
    IGmxRewardTracker private immutable sGMX;
    IGlpManager private immutable glpManager;
    IGmxVester private immutable glpVester;

    ITapiocaOracle public wethGlpOracle;
    bytes public wethGlpOracleData;

    uint256 private _slippage = 50;
    uint256 private constant _MAX_SLIPPAGE = 10000;
    ICluster internal cluster;

    event SlippageUpdated(uint256 indexed oldVal, uint256 indexed newVal);
    event ClusterUpdated(ICluster indexed oldCluster, ICluster indexed newCluster);

    // *********************************** //
    /* ============ ERROR ============ */
    // *********************************** //

    error WethMismatch();
    error GlpRewardRouterNotValid();
    error GmxRewardRouterNotValid();
    error NotAuthorized();
    error NotValid();
    error Failed();
    error PauserNotAuthorized();
    error EmptyAddress();

    constructor(
        IYieldBox _yieldBox,
        IGmxRewardRouterV2 _gmxRewardRouter,
        IGmxRewardRouterV2 _glpRewardRouter,
        ITOFT _tsGlp,
        ITapiocaOracle _wethGlpOracle,
        bytes memory _wethGlpOracleData,
        address _owner
    ) BaseERC20Strategy(_yieldBox, address(_tsGlp)) {
        weth = IERC20(_yieldBox.wrappedNative());
        if (address(weth) != _gmxRewardRouter.weth()) revert WethMismatch();

        // Check if the GMX reward router is valid and set it
        address _gmx = _gmxRewardRouter.gmx();
        if (_gmx == address(0)) revert GmxRewardRouterNotValid();
        gmxRewardRouter = _gmxRewardRouter;
        glpRewardRouter = _glpRewardRouter;
        gmx = IERC20(_gmx);

        // Get GMX vars
        sbfGMX = IGmxRewardTracker(gmxRewardRouter.feeGmxTracker());
        fGLP = IGmxRewardTracker(glpRewardRouter.feeGlpTracker());
        glpManager = IGlpManager(glpRewardRouter.glpManager());
        glpVester = IGmxVester(gmxRewardRouter.glpVester());

        sGLP = IERC20(ITOFT(contractAddress).erc20()); // We cache the sGLP token

        // Load the oracle
        wethGlpOracle = _wethGlpOracle;
        wethGlpOracleData = _wethGlpOracleData;

        transferOwnership(_owner);
    }

    // *********************************** //
    /* ============ VIEW ============ */
    // *********************************** //

    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "sGLP";
    }

    /// @notice Returns the description of this strategy
    function description() external pure override returns (string memory description_) {
        return "Holds staked GLP tokens and compounds the rewards";
    }

    /// @notice Returns The estimate the pending GLP.
    /// @dev Doesn't revert because we want to still check current balance in `_currentBalance()`
    /// @return amount The amount of GLP that should be received
    function pendingRewards() public view returns (uint256 amount) {
        // Add WETH pending fees
        uint256 wethAmount = sbfGMX.claimable(address(this));
        wethAmount += fGLP.claimable(address(this));

        // Convert WETH to GLP
        (, uint256 glpPrice) = wethGlpOracle.peek(wethGlpOracleData);
        amount = (wethAmount * glpPrice) / 1e18;
    }

    // *********************************** //
    /* ============ EXTERNAL ============ */
    // *********************************** //

    /// @notice Claim sGLP reward and reinvest
    function harvest() public {
        _claimRewards();
        _buyGlp();
    }

    // *********************************** //
    /* ============ OWNER ============ */
    // *********************************** //
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

    /// @notice sets the slippage used in swap operations
    /// @param _val the new slippage amount
    function setSlippage(uint256 _val) external onlyOwner {
        if (_val > _MAX_SLIPPAGE) revert NotValid();
        emit SlippageUpdated(_slippage, _val);
        _slippage = _val;
    }

    // *********************************** //
    /* ============ INTERNAL ============ */
    // *********************************** //

    /// @notice Returns the amount of sGLP staked in the strategy
    function _currentBalance() internal view override returns (uint256 amount) {
        amount = sGLP.balanceOf(address(this));
        amount += pendingRewards();
    }

    /**
     * @notice Deposits the specified amount into the strategy
     * @dev Since the contract strategy is for tsGLP, we need to unwrap it to sGLP
     */
    function _deposited(uint256 amount) internal override whenNotPaused {
        ITOFT(contractAddress).unwrap(address(this), amount); // unwrap the tsGLP to sGLP to this contract
        harvest();
    }

    /**
     * @notice Withdraws the specified amount from the strategy
     * @dev We wrap back the sGLP to tsGLP and transfer it to the recipient
     */
    function _withdraw(address to, uint256 amount) internal override {
        if (amount == 0) revert NotValid();
        _claimRewards(); // Claim rewards before withdrawing
        _buyGlp(); // Buy GLP with WETH rewards

        sGLP.safeApprove(contractAddress, amount);
        uint256 wrapped = ITOFT(contractAddress).wrap(address(this), address(this), amount); // wrap the sGLP to tsGLP first
        sGLP.safeApprove(contractAddress, 0);

        IERC20(contractAddress).safeTransfer(to, wrapped); // transfer the tsGLP to the recipient
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

        if (wethAmount > 0) {
            bool success;
            uint256 glpPrice;

            (success, glpPrice) = wethGlpOracle.get(wethGlpOracleData);
            if (!success) revert Failed();
            uint256 amountInGlp = (wethAmount * glpPrice) / 1e18;
            amountInGlp = amountInGlp - (amountInGlp * _slippage) / 10_000; //0.5%

            _safeApprove(address(weth), address(glpManager), wethAmount);
            glpRewardRouter.mintAndStakeGlp(address(weth), wethAmount, 0, amountInGlp);
        }
    }

    function _safeApprove(address token, address to, uint256 value) internal {
        require(token.code.length > 0, "GlpStrategy::safeApprove: no contract");
        bool success;
        bytes memory data;
        (success, data) = token.call(abi.encodeCall(IERC20.approve, (to, 0)));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "GlpStrategy::safeApprove: approve failed");

        (success, data) = token.call(abi.encodeCall(IERC20.approve, (to, value)));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "GlpStrategy::safeApprove: approve failed");
    }
}
