// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Tapioca 
import {IStargateV2MultiRewarder} from "tapioca-strategies/interfaces/stargatev2/IStargateV2MultiRewarder.sol";
import {IStargateV2Staking} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Staking.sol";
import {IStargateV2Pool} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Pool.sol";
import {ITapiocaOracle} from "tap-utils/interfaces/periph/ITapiocaOracle.sol";
import {IZeroXSwapper} from "tap-utils/interfaces/periph/IZeroXSwapper.sol";
import {IPearlmit} from "tap-utils/interfaces/periph/IPearlmit.sol";
import {BaseERC20Strategy} from "yieldbox/strategies/BaseStrategy.sol";
import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";
import {ITOFT} from "tap-utils/interfaces/oft/ITOFT.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";

/*
████████╗ █████╗ ██████╗ ██╗ ██████╗  ██████╗ █████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██╔═══██╗██╔════╝██╔══██╗
   ██║   ███████║██████╔╝██║██║   ██║██║     ███████║
   ██║   ██╔══██║██╔═══╝ ██║██║   ██║██║     ██╔══██║
   ██║   ██║  ██║██║     ██║╚██████╔╝╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
*/

contract StargateV2Strategy is BaseERC20Strategy, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    
    IStargateV2Pool public pool;
    IStargateV2Staking public farm;
    IERC20 public inputToken; //erc20 of token.erc20()
    IERC20 public lpToken;
    IZeroXSwapper public swapper;

    ITapiocaOracle public stgInputTokenOracle;
    bytes public stgInputTokenOracleData;

    ITapiocaOracle public arbInputTokenOracle;
    bytes public arbInputTokenOracleData;

    ICluster internal cluster;
    bool public depositPaused;
    bool public withdrawPaused;

    enum PauseType {
        Deposit,
        Withdraw
    }

    struct SSwapData {
        uint256 minAmountOut;
        IZeroXSwapper.SZeroXSwapData data;
    }

    address public constant STG = 0x6694340fc020c5E6B96567843da2df01b2CE1eb6;
    address public constant ARB = 0x912CE59144191C1204E64559FE8253a0e49E6548;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event AmountDeposited(uint256 amount);
    event AmountWithdrawn(address indexed to, uint256 amount);
    event ClusterUpdated(ICluster indexed oldCluster, ICluster indexed newCluster);
    event SwapperUpdated(IZeroXSwapper indexed oldCluster, IZeroXSwapper indexed newCluster);
    event PoolUpdated(address indexed oldAddy, address indexed newAddy);
    event FarmUpdated(address indexed oldAddy, address indexed newAddy);
    event Paused(bool prev, bool crt, bool isDepositType);
    event ArbOracleUpdated(address indexed oldAddy, address indexed newAddy);
    event StgOracleUpdated(address indexed oldAddy, address indexed newAddy);

    // ************** //
    // *** ERRORS *** //
    // ************** //
    error TokenNotValid();
    error TransferFailed();
    error DepositPaused();
    error WithdrawPaused();
    error PauserNotAuthorized();
    error EmptyAddress();
    error SwapFailed();

    constructor(
        IYieldBox _yieldBox,
        ICluster _cluster,
        address _token, 
        address _pool, 
        address _farm, 
        ITapiocaOracle _stgInputTokenOracle,
        bytes memory _stgInputTokenOracleData,
        ITapiocaOracle _arbInputTokenOracle,
        bytes memory _arbInputTokenOracleData,
        IZeroXSwapper _swapper,
        address _owner
    ) BaseERC20Strategy(_yieldBox, _token) {
        if (_pool == address(0)) revert EmptyAddress();
        if (_farm == address(0)) revert EmptyAddress();

        cluster = _cluster;

        pool = IStargateV2Pool(_pool);
        farm = IStargateV2Staking(_farm);
        inputToken = IERC20(ITOFT(_token).erc20());
        lpToken = IERC20(pool.lpToken());

        stgInputTokenOracle = _stgInputTokenOracle;
        stgInputTokenOracleData = _stgInputTokenOracleData;

        arbInputTokenOracle = _arbInputTokenOracle;
        arbInputTokenOracleData = _arbInputTokenOracleData;

        swapper = _swapper;

        transferOwnership(_owner);
    }

    // *********************** //
    // *** OWNER FUNCTIONS *** //
    // *********************** //

    /// @notice updates the pause state
    /// @param _val the new state
    /// @param depositType if true, pause refers to deposits
    function setPause(bool _val, PauseType depositType) external {
        if (!cluster.hasRole(msg.sender, keccak256("PAUSABLE")) && msg.sender != owner()) revert PauserNotAuthorized();

        if (depositType == PauseType.Deposit) {
            emit Paused(depositPaused, _val, true);
            depositPaused = _val;
        } else {
            emit Paused(withdrawPaused, _val, false);
            withdrawPaused = _val;
        }
    }

    /// @notice rescues unused ETH from the contract
    /// @param amount the amount to rescue
    /// @param to the recipient
    function rescueEth(uint256 amount, address to) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice withdraws everything from the strategy
    /// @dev Withdraws everything from the strategy and pauses it
    function emergencyWithdraw() external onlyOwner {
        // Pause the strategy
        depositPaused = true;
        withdrawPaused = true;

        uint256 amount = farm.balanceOf(address(lpToken), address(this));

         // withdraw from farm
        farm.withdraw(address(lpToken), amount);
        
        // withdraw from pool
        uint256 received = pool.redeem(amount, address(this));

         // wrap `inputToken` into `contractAddress`
        ITOFT toft = ITOFT(contractAddress);
        IPearlmit pearlmit = toft.pearlmit();
        
        //    - approve pearlmit
        inputToken.safeApprove(address(pearlmit), received);
        pearlmit.approve(20, address(inputToken), 0, contractAddress, received.toUint200(), block.timestamp.toUint48());

        toft.wrap(address(this), address(this), received); // `received` should be == `wrapped`

        //     - reset approvals
        inputToken.safeApprove(address(pearlmit), 0);
        pearlmit.clearAllowance(address(this), 20, address(inputToken), 0);
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

    /**
     * @notice updates the Swapper address.
     * @dev can only be called by the owner.
     * @param _swapper the new address.
     */
    function setSwapper(IZeroXSwapper _swapper) external onlyOwner {
        if (address(_swapper) == address(0)) revert EmptyAddress();
        emit SwapperUpdated(swapper, _swapper);
        swapper = _swapper;
    }

    /**
     * @notice updates the StargateV2 pool address.
     * @dev can only be called by the owner.
     * @param _pool the new address.
     */
    function setPool(address _pool) external onlyOwner {
        if (address(_pool) == address(0)) revert EmptyAddress();
        emit PoolUpdated(address(pool), _pool);
        pool = IStargateV2Pool(_pool);
    }

    /**
     * @notice updates the StargateV2 staking address.
     * @dev can only be called by the owner.
     * @param _farm the new address.
     */
    function setFarm(address _farm) external onlyOwner {
        if (address(_farm) == address(0)) revert EmptyAddress();
        emit FarmUpdated(address(farm), _farm);
        farm = IStargateV2Staking(_farm);
    }

    /**
     * @notice updates the oracle address.
     * @dev can only be called by the owner.
     * @param _oracle the new address.
     * @param _oracleData the new data.
     */
    function setArbOracle(ITapiocaOracle _oracle, bytes calldata _oracleData) external onlyOwner {
        if (address(_oracle) == address(0)) revert EmptyAddress();
        emit ArbOracleUpdated(address(arbInputTokenOracle), address(_oracle));
        arbInputTokenOracle = _oracle;
        arbInputTokenOracleData = _oracleData;
    }

    /**
     * @notice updates the oracle address.
     * @dev can only be called by the owner.
     * @param _oracle the new address.
     * @param _oracleData the new data.
     */
    function setStgOracle(ITapiocaOracle _oracle, bytes calldata _oracleData) external onlyOwner {
        if (address(_oracle) == address(0)) revert EmptyAddress();
        emit StgOracleUpdated(address(stgInputTokenOracle), address(_oracle));
        stgInputTokenOracle = _oracle;
        stgInputTokenOracleData = _oracleData;
    }

    /**
    * @notice invests currently available STG for compounding interest
    */
    function invest(bytes calldata arbData, bytes calldata stgData) external onlyOwner {
        IERC20 _stg = IERC20(STG);
        IERC20 _arb = IERC20(ARB);
        
        // should only harvest for the current `lpToken`
        uint256 availableStg = _stg.balanceOf(address(this));
        uint256 availableArb = _arb.balanceOf(address(this));
        if (availableStg == 0 && availableArb == 0) return;
        
        if(availableStg > 0) {
            // swap STG to usdc
            SSwapData memory swapData = abi.decode(stgData, (SSwapData));
            _stg.safeApprove(address(swapper), availableStg);
            uint256 amountOut = swapper.swap(swapData.data, availableStg, swapData.minAmountOut);
            _stg.safeApprove(address(swapper), 0);
            if (amountOut < swapData.minAmountOut) revert SwapFailed();

            // _deposit & stake
            _depositAndStake(amountOut);
        }

        if (availableArb > 0) {
            // swap STG to usdc
            SSwapData memory swapData = abi.decode(arbData, (SSwapData));
            _arb.safeApprove(address(swapper), availableArb);
            uint256 amountOut = swapper.swap(swapData.data, availableArb, swapData.minAmountOut);
            _arb.safeApprove(address(swapper), 0);
            if (amountOut < swapData.minAmountOut) revert SwapFailed();

            // _deposit & stake
            _depositAndStake(amountOut);
        }
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /**
    * @notice Returns the name of this strategy
    */
    function name() external pure override returns (string memory name_) {
        return "STG V2";
    }

    /**
    * @notice Returns the description of this strategy
    */
    function description() external pure override returns (string memory description_) {
        return "Stargate V2 Strategy";
    }

    /**
    * @notice Returns The estimate the pending rewards.
    * @return amount The amount of STG that should be harvested
    */
    function pendingRewards() public view returns (uint256 amount) {
        uint256 tokenIndex;
        address _rewarder = farm.rewarder(address(lpToken));
        (address[] memory tokens, uint256[] memory rewards) = IStargateV2MultiRewarder(_rewarder).getRewards(address(lpToken), address(this));

        tokenIndex = _findIndex(tokens, STG);
        if (tokenIndex != 404 ) {
            (, uint256 stgPrice) = stgInputTokenOracle.peek(stgInputTokenOracleData);
            amount += (rewards[tokenIndex] * stgPrice) / 1e18;
        }
        
        tokenIndex = _findIndex(tokens, ARB);
        if (tokenIndex != 404 ) {
            (, uint256 arbPrice) = arbInputTokenOracle.peek(arbInputTokenOracleData);
            amount += ( rewards[tokenIndex] * arbPrice) / 1e18;
        }

        return amount;
    }
    
    /**
     * @notice claims STG from farm
     */
    function claim(address[] calldata tokens) external {
        // should only harvest for the current `lpToken`
        if (tokens.length > 1 || tokens[0] != address(lpToken)) revert TokenNotValid();
        farm.claim(tokens);
    }

    // *********************************** //
    /* ============ INTERNAL ============ */
    // *********************************** //
    function _currentBalance() internal view override returns (uint256 amount) {
        /// @dev: wrap fees are not taken into account here because it's 0
        amount = farm.balanceOf(address(lpToken), address(this));
        amount += IERC20(contractAddress).balanceOf(address(this));
        amount += pendingRewards();
    }

    function _deposited(uint256 amount) internal override nonReentrant {
        if (depositPaused) revert DepositPaused();

        // unwrap; fees are 0
        ITOFT(contractAddress).unwrap(address(this), amount); 
        
        // pool deposit & farm staking
        _depositAndStake(amount);
    }

   
    function _withdraw(address to, uint256 amount) internal override nonReentrant {
        if (withdrawPaused) revert WithdrawPaused();

        uint256 assetInContract = IERC20(contractAddress).balanceOf(address(this));

        //  check first if `contractAddress` is already available without performing any withdrawal action
        uint256 toWithdrawFromPool;
        unchecked {
            toWithdrawFromPool = amount > assetInContract ? amount - assetInContract : 0; // Asset to withdraw from the pool if not enough available in the contract
        }

        if (toWithdrawFromPool == 0) {
            IERC20(contractAddress).safeTransfer(to, amount);
            emit AmountWithdrawn(to, amount);
            return;
        }

        // withdraw remaining
        //   - withdraw from farm
        farm.withdraw(address(lpToken), toWithdrawFromPool);
        
        //   - withdraw from pool
        uint256 received = pool.redeem(toWithdrawFromPool, address(this));

        //   - wrap `inputToken` into `contractAddress`
        ITOFT toft = ITOFT(contractAddress);
        IPearlmit pearlmit = toft.pearlmit();
        
        //       - approve pearlmit
        inputToken.safeApprove(address(pearlmit), received);
        pearlmit.approve(20, address(inputToken), 0, contractAddress, received.toUint200(), block.timestamp.toUint48());
        toft.wrap(address(this), address(this), received); // wrap fees are 0
        //       - reset approvals
        inputToken.safeApprove(address(pearlmit), 0);
        pearlmit.clearAllowance(address(this), 20, address(inputToken), 0);

        // send `contractAddress`
        IERC20(contractAddress).safeTransfer(to, amount);
        emit AmountWithdrawn(to, amount);
    }

    // ********************************* //
    /* ============ PRIVATE ============ */
    // ********************************* //
    function _findIndex(address[] memory _tokens, address _token) private pure returns (uint256) {
        uint256 len = _tokens.length;
        for (uint256 i; i < len; i++) {
            if (_tokens[i] == _token) {
                return i;
            }
        }
        // if index not found, return an arbitrary number 404, unexpected to have 404 different rewards in one staking contract
        return 404;
    }

     function _depositAndStake(uint256 amount) private {
        inputToken.safeApprove(address(pool), type(uint256).max);
        uint256 lpAmount = pool.deposit(address(this), amount);
        inputToken.safeApprove(address(pool), 0);
        
        // farm deposit
        lpToken.safeApprove(address(farm), type(uint256).max);
        farm.deposit(address(lpToken), lpAmount);
        lpToken.safeApprove(address(farm), 0);

        emit AmountDeposited(lpAmount);
    }

}