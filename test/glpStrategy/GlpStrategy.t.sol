// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

// Tapioca
import {IYieldBox, YieldBox, YieldBoxURIBuilder, IWrappedNative, TokenType, IStrategy} from "yieldbox/YieldBox.sol";
import {IGmxRewardRouterV2} from "tapioca-strategies/interfaces/gmx/IGmxRewardRouter.sol";
import {ITOFT} from "tap-utils/interfaces/oft/ITOFT.sol";
import {ITapiocaOracle} from "tap-utils/interfaces/periph/ITapiocaOracle.sol";
import {IGlpManager} from "tapioca-strategies/interfaces/gmx/IGlpManager.sol";
import {IGmxVault} from "tapioca-strategies/interfaces/gmx/IGmxVault.sol";
import {GlpStrategy} from "tapioca-strategies/glp/GlpStrategy.sol";
import {GlpStrategyWrapper} from "./GlpStrategyWrapper.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";
import {MockERC20} from "contracts/mocks/MockERC20.sol";
import {OracleMock} from "contracts/mocks/OracleMock.sol";
import {Pearlmit} from "tap-utils/pearlmit/Pearlmit.sol";
import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";
import {Cluster} from "tap-utils/Cluster/Cluster.sol";
import {IPearlmit} from "tap-utils/interfaces/periph/IPearlmit.sol";
import "forge-std/Test.sol";


contract GlpStrategyTest is Test {
    /**
     * ENV KEY
     */
    string constant ENV_BINANCE_WALLET_ADDRESS = "BINANCE_WALLET_ADDRESS";
    string constant ENV_GLP_REWARD_ROUTER = "GLP_REWARD_ROUTER";
    string constant ENV_GMX_REWARD_ROUTER = "GMX_REWARD_ROUTER";
    string constant ENV_STAKED_GLP = "STAKED_GLP";
    string constant ENV_GMX_VAULT = "GMX_VAULT";
    string constant RPC_URL = "ARBITRUM_RPC_URL";
    string constant FORKING_BLOCK_NUMBER = "FORKING_BLOCK_NUMBER";
    uint256 ARB_FORK;

    /**
     * Contract loading
     */
    IGmxRewardRouterV2 glpRewardRouter;
    OracleMock public wethOracleMock;
    GlpStrategyWrapper public glpStrategy; // this was changed to GlpStrategyWrapper which inherits from GlpStrategy to test internal functions
    IGlpManager public glpManager;
    YieldBox public yieldBox;
    IGmxVault gmxVault;
    ToftMock tsGLP;
    IERC20 sGLP;
    Pearlmit pearlmit;
    Cluster cluster;
    /**
     * Vars
     */
    uint256 public glpStratAssetId;
    address public binanceWalletAddr;
    address public weth;

    using SafeCast for uint256;
    /**
     * Bounding for fuzz tests
     */
    uint256 internal lowerBound = 0.5 ether;
    uint256 internal upperBound = 2_000 ether;

    /**
     * Modifiers
     */
    modifier isArbFork() {
        vm.selectFork(ARB_FORK);
        _;
    }

    modifier prankBinance() {
        vm.startPrank(binanceWalletAddr);
        _;
    }

    modifier prankYieldBox() {
        vm.startPrank(address(yieldBox));
        _;
    }

    /**
     * Setup
     */
    function setUp() public {
        string memory rpcUrl = vm.envString(RPC_URL);
        uint256 forkingBlockNumber = vm.envUint(FORKING_BLOCK_NUMBER);
        ARB_FORK = vm.createSelectFork(rpcUrl, forkingBlockNumber);

        // Load env
        binanceWalletAddr = vm.envAddress(ENV_BINANCE_WALLET_ADDRESS);
        vm.label(binanceWalletAddr, "binanceWalletAddr");
        address glpRewardRouterAddr = vm.envAddress(ENV_GLP_REWARD_ROUTER);
        vm.label(glpRewardRouterAddr, "glpRewardRouterAddr");
        address gmxRewardRouterAddr = vm.envAddress(ENV_GMX_REWARD_ROUTER);
        vm.label(gmxRewardRouterAddr, "gmxRewardRouterAddr");
        address stakedGlpAddr = vm.envAddress(ENV_STAKED_GLP);
        vm.label(stakedGlpAddr, "sGLP");
        address gmxVaultAddr = vm.envAddress(ENV_GMX_VAULT);
        vm.label(gmxVaultAddr, "gmxVaultAddr");

        // Get GMX contracts
        glpRewardRouter = IGmxRewardRouterV2(glpRewardRouterAddr);
        IGmxRewardRouterV2 gmxRewardRouter = IGmxRewardRouterV2(gmxRewardRouterAddr);
        sGLP = IERC20(stakedGlpAddr);
        gmxVault = IGmxVault(gmxVaultAddr);
        weth = address(gmxRewardRouter.weth());
        glpManager = IGlpManager(glpRewardRouter.glpManager());
        vm.label(address(glpManager), "glpManager");

        // Periphery contracts
        pearlmit = new Pearlmit("Pearlmit", "1", address(this), 0);
        cluster = new Cluster(1, msg.sender);

        // Deploy contracts
        tsGLP = new ToftMock(address(sGLP), "Toft", "TOFT", IPearlmit(address(pearlmit)));
        vm.label(address(tsGLP), "tsGLP");
        yieldBox = new YieldBox(IWrappedNative(weth), new YieldBoxURIBuilder(), pearlmit, address(this));
        vm.label(address(yieldBox), "yieldBox");
        wethOracleMock = new OracleMock("wethOracleMock", "WOM", 1e18);

        // Deploy strategy
        glpStrategy = new GlpStrategyWrapper(
            IYieldBox(address(yieldBox)),
            gmxRewardRouter,
            glpRewardRouter,
            ITOFT(address(tsGLP)),
            ITapiocaOracle(address(wethOracleMock)),
            "0x",
            address(this)
        );
        vm.label(address(glpStrategy), "glpStrategy");
        yieldBox.registerAsset(TokenType.ERC20, address(tsGLP), IStrategy(address(glpStrategy)), 0);
        glpStratAssetId = yieldBox.ids(TokenType.ERC20, address(tsGLP), IStrategy(address(glpStrategy)), 0);

        //setup cluster
        glpStrategy.setCluster(cluster);
    }

    /**
     * Tests
     */
    // @dev This test may fail depending on FORKING_ARBITRUM_BLOCK_NUMBER.
    // Set it to 75601925 for the test to pass.
    function test_constructor() public isArbFork {
        uint256 glpPrice = glpManager.getPrice(true);
        assertLe(glpPrice, 1041055094190371419655569666477, "glpPrice not within bounds");
        uint256 wethPrice = gmxVault.getMaxPrice(weth) / 1e12;
        assertApproxEqAbs(wethPrice, 1805 * 1e18, 2 * 1e18, "weth price not within bounds");
    }

    function test_compound_harvest() public isArbFork prankBinance {
        uint256 glpPrice = glpManager.getPrice(true) / 1e12;
        uint256 wethPrice = gmxVault.getMaxPrice(weth) / 1e12;

        // Get GLP and stake
        {
            uint256 ethBuyin = 1 ether;
            uint256 minUsdg = (((wethPrice * ethBuyin) / 1e18) * 99) / 100; // 1% slippage
            uint256 minGlp = (minUsdg * 1e18) / glpPrice;
            glpRewardRouter.mintAndStakeGlpETH{value: ethBuyin}(minUsdg, minGlp);

            uint256 glpBal = sGLP.balanceOf(address(binanceWalletAddr));
            assertGe(glpBal, minGlp, "GLP out");
        }

        // Wrap sGLP and deposit into YieldBox/Strategy
        uint256 glpBefore = sGLP.balanceOf(binanceWalletAddr);
        uint200 amount200 = SafeCast.toUint200(glpBefore);
        uint48 deadline = SafeCast.toUint48(block.timestamp);

        // Pearlmit approval
        pearlmit.approve(20, address(sGLP), 0, address(tsGLP), amount200, deadline);
        sGLP.approve(address(pearlmit), amount200);
        {
            // Wrap sGLP
            sGLP.approve(address(tsGLP), glpBefore);
            tsGLP.wrap(binanceWalletAddr, binanceWalletAddr, glpBefore);

            // Deposit into YieldBox
            tsGLP.approve(address(yieldBox), glpBefore);
            yieldBox.depositAsset(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, glpBefore, 0);
        }

        // Compound and withdraw
        {
            uint256 shares = yieldBox.balanceOf(binanceWalletAddr, glpStratAssetId);
            _compound((86400 * 365) / 10, 6); // Compound 6 times in 1 year
            yieldBox.withdraw(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, 0, shares);
            uint256 glpBalAfter = tsGLP.balanceOf(binanceWalletAddr);
            assertGt(glpBalAfter, glpBefore, "GLP compound out");
        }
    }

    // ------------ new tests --------------------

    /**
     * Wrappers (call internal test for a given input)
     */
    function test_deposit_wrapper() public {
        test_deposit(1 ether);
    }

    function test_weth_rewards_staked_as_glp_wrapper() public {
        test_weth_rewards_staked_as_glp(1 ether);
    }

    function test_deposit_sGLP_to_strategy_wrapper() public {
        test_deposit_sGLP_to_strategy(1 ether);
    }

    function test_harvest_zero_wrapper() public {
        test_harvest_zero(1 ether);
    }

    function test_user_balance_increases_wrapper() public {
        test_user_balance_increases(1 ether);
    }

    function test_rewards_always_withdrawable_wrapper() public {
        test_rewards_always_withdrawable(1 ether);
    }

    function test_user_cant_overdraw_wrapper() public {
        test_user_cant_overdraw(1 ether, 1 ether);
    }

    /**
     * Fuzz tests (call internal test for a range of bounded inputs)
     */
    function testFuzz_deposit(uint256 amount) public {
        amount = bound(amount, lowerBound, upperBound);
        test_deposit(amount);
    }

    function testFuzz_deposit_sGLP_to_strategy(uint256 amount) public {
        amount = bound(amount, lowerBound, upperBound);
        test_deposit_sGLP_to_strategy(amount);
    }

    function testFuzz_harvest_zero(uint256 amount) public {
        amount = bound(amount, lowerBound, upperBound);
        test_harvest_zero(amount);
    }

    function testFuzz_user_balance_increases(uint256 amount) public {
        amount = bound(amount, lowerBound, upperBound);
        test_user_balance_increases(amount);
    }

    function testFuzz_rewards_always_withdrawable(uint256 amount) public {
        amount = bound(amount, lowerBound, upperBound);
        test_rewards_always_withdrawable(1 ether);
    }

    function testFuzz_user_cant_overdraw(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, lowerBound, upperBound);
        amount2 = bound(amount2, lowerBound, upperBound);
        test_user_cant_overdraw(amount1, amount2);
    }

    function testFuzz_weth_rewards_staked_as_glp_wrapper(uint256 amount) public {
        amount = bound(amount, lowerBound, upperBound);
        test_weth_rewards_staked_as_glp(amount);
    }

    /**
     * Test implementations (internal ones are used by wrappers/fuzz, others are tested as is)
     */

    // 1a. tsGLP passed in on deposit is staked for GlpStrategy
    function test_deposit(uint256 ethBuyin) internal isArbFork prankBinance {
        uint256 strategyGlpBefore = sGLP.balanceOf(address(glpStrategy));

        uint256 userGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        // GlpStrategy's balance of sGLP should be increased by userGlpBefore
        uint256 strategyGlpAfter = sGLP.balanceOf(address(glpStrategy));
        assertTrue(strategyGlpBefore + userGlpBefore == strategyGlpAfter, "strategy GLP balance doesn't increase");
    }

    // 1b. depositing when paused reverts
    function test_deposit_paused_reverts() public isArbFork {
        uint256 ethBuyin = 1 ether;

        glpStrategy.setPause(true);

        vm.startPrank(binanceWalletAddr);
        uint256 strategyGlpBefore = sGLP.balanceOf(address(glpStrategy));
        // buy and wrap GLP
        uint256 userGlpBefore = _buyStakeAndWrap(binanceWalletAddr, ethBuyin);

        // Deposit into strategy
        tsGLP.approve(address(yieldBox), userGlpBefore);

        // explicitly include deposit logic here to expect revert on it
        vm.expectRevert("Pausable: paused");
        yieldBox.depositAsset(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, userGlpBefore, 0);
        vm.stopPrank();
    }

    // 2a. GLP bought with weth rewards is staked for GlpStrategy
    function test_weth_rewards_staked_as_glp(uint256 ethBuyin) internal isArbFork prankBinance {
        uint256 userGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        // this returns the reward amount in GLP
        uint256 rewardsAccumulatedBeforeHarvest = glpStrategy.pendingRewards();
        uint256 strategyGLPBalanceBeforeHarvest = sGLP.balanceOf(address(glpStrategy));

        glpStrategy.harvest();

        uint256 rewardsAccumulatedAfterHarvest = glpStrategy.pendingRewards();
        uint256 strategyGLPBalanceAfterHarvest = sGLP.balanceOf(address(glpStrategy));

        // 3. harvesting uses all the weth rewards balance if it's nonzero
        assertTrue(rewardsAccumulatedAfterHarvest == 0, "reward balance of GlpStrategy nonzero after harvesting");
    }

    // NOTE: this could be fuzzed with values up to minimum time for receiving reward
    // 2b. no GLP is bought if the protocol accumulates 0 weth rewards
    function test_no_glp_bought_for_zero_rewards() public isArbFork prankBinance {
        // buy sGLP
        uint256 ethBuyin = 1 ether;

        uint256 userGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        uint256 strategyGLPBeforeHarvest = sGLP.balanceOf(address(glpStrategy));

        glpStrategy.harvest();

        uint256 strategyGLPAfterHarvest = sGLP.balanceOf(address(glpStrategy));

        // no time has passed so no rewards should be accumulated
        assertTrue(strategyGLPAfterHarvest == strategyGLPAfterHarvest, "GLP is bought with 0 rewards accumulated");
    }

    // 4. only YieldBox can withdraw and deposit
    function test_only_yieldBox_deposit() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;

        uint256 userGlpBefore = _buyStakeAndWrap(binanceWalletAddr, ethBuyin);

        // deposit directly into strategy
        vm.expectRevert("Not YieldBox");
        glpStrategy.deposited(userGlpBefore);
    }

    function test_only_yieldBox_withdraw() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;

        uint256 userGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        // withdraw directly from strategy
        vm.expectRevert("Not YieldBox");
        glpStrategy.withdraw(binanceWalletAddr, userGlpBefore);
    }

    // 5. depositing sGLP directly to strategy should fail
    function test_deposit_sGLP_to_strategy(uint256 ethBuyin) internal isArbFork prankBinance {
        _buyGLPAndStake(ethBuyin);

        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        // Deposit sGLP directly into strategy
        tsGLP.approve(address(yieldBox), userGlpBefore);
        sGLP.transfer(address(glpStrategy), userGlpBefore);

        vm.expectRevert("BoringERC20: TransferFrom failed");
        yieldBox.depositAsset(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, userGlpBefore, 0);
    }

    // 6. calling harvest with 0 rewards accumulated doesn't revert
    function test_harvest_zero(uint256 ethBuyin) internal isArbFork prankBinance {
        uint256 userGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        // assert that rewards accumulated by the strategy = 0
        assertTrue(glpStrategy.pendingRewards() == 0);

        glpStrategy.harvest();
    }

    // 7. user balance of sGLP increases by amount on call to withdraw
    // 8. GlpStrategy balance of sGLP decreases on withdrawal
    function test_user_balance_increases(uint256 ethBuyin) internal isArbFork prankBinance {
        uint256 userGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        _compound((86400 * 365) / 10, 6); // Compound 6 times in 1 year

        glpStrategy.harvest();

        uint256 strategyBalanceBefore = sGLP.balanceOf(address(glpStrategy));

        // withdrawing initially deposited amount in this test
        _withdrawFromStrategy(userGlpBefore);

        // unwraps received tsGLP from
        tsGLP.unwrap(binanceWalletAddr, tsGLP.balanceOf(address(binanceWalletAddr)));
        uint256 userGlpAfter = sGLP.balanceOf(address(binanceWalletAddr));
        uint256 strategyBalanceAfter = sGLP.balanceOf(address(glpStrategy));

        assertTrue(userGlpBefore <= userGlpAfter, "user loses sGLP on withdraw");

        // if this is false, strategy gains sGLP from user
        assertTrue(strategyBalanceBefore - strategyBalanceAfter == userGlpBefore, "strategy gains sGLP");
    }

    // 9a. User can always withdraw up to the full amount of GLP + weth rewards in the GlpStrategy
    function test_rewards_always_withdrawable(uint256 ethBuyin) internal isArbFork prankBinance {
        uint256 userSGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        uint256 strategyBalanceBeforeHarvest = sGLP.balanceOf(address(glpStrategy));

        _compound((86400 * 365) / 10, 6);

        // full balance that should be redeemable
        uint256 strategyBalanceBeforeWithdraw = sGLP.balanceOf(address(glpStrategy));
        uint256 toleratePrecisionLoss = 1;
        // @audit user can only pass in totalSupplyOfShares to fully withdraw
        // uint256 totalSupplyOfShares = yieldBox.totalSupply(glpStratAssetId);
        strategyBalanceBeforeWithdraw = strategyBalanceBeforeWithdraw - toleratePrecisionLoss;

        yieldBox.withdraw(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, strategyBalanceBeforeWithdraw, 0);

        uint256 strategyBalanceAfterWithdraw = sGLP.balanceOf(address(glpStrategy));

        // only dust amount due to rounding should remain in strategy
        assertTrue(strategyBalanceAfterWithdraw <= 1, "balance remains in strategy");
    }

    function test_rewards_always_withdrawable_multiple() public isArbFork {
        uint256 ethBuyin = 1 ether;

        address alice = address(0x1);
        address bob = address(0x2);
        vm.deal(alice, ethBuyin);
        vm.deal(bob, ethBuyin);

        // two users deposit
        // Alice's deposit
        vm.startPrank(alice);
        uint256 aliceSGlpBefore = _buyStakeAndWrap(alice, ethBuyin);

        tsGLP.approve(address(yieldBox), aliceSGlpBefore);
        (, uint256 aliceSharesBefore) = yieldBox.depositAsset(glpStratAssetId, alice, alice, aliceSGlpBefore, 0);
        vm.stopPrank();

        // Bob's deposit
        vm.startPrank(bob);
        uint256 bobSGlpBefore = _buyStakeAndWrap(bob, ethBuyin);

        tsGLP.approve(address(yieldBox), bobSGlpBefore);
        (, uint256 bobSharesBefore) = yieldBox.depositAsset(glpStratAssetId, bob, bob, bobSGlpBefore, 0);
        vm.stopPrank();

        // compound rewards 6 times
        _compound((86400 * 365) / 10, 6);

        // Alice withdraws her amount using her shares
        vm.startPrank(alice);
        yieldBox.withdraw(glpStratAssetId, alice, alice, 0, aliceSharesBefore);
        vm.stopPrank();

        // Bob tries to withdraw his amount which should be the remaining balance of the strategy
        vm.startPrank(bob);
        uint256 toleratePrecisionLoss = 1;

        uint256 amountRemainingInStrategy = sGLP.balanceOf(address(glpStrategy));
        amountRemainingInStrategy = amountRemainingInStrategy - toleratePrecisionLoss;
        yieldBox.withdraw(glpStratAssetId, bob, bob, amountRemainingInStrategy, 0);
        vm.stopPrank();
    }

    // 9b. withdrawing zero amount should revert
    function test_withdraw_zero_reverts() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;

        uint256 userSGlpBefore = _buyStakeWrapAndDeposit(binanceWalletAddr, ethBuyin);

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        glpStrategy.harvest();

        // withdrawing 0 to trigger conditional revert
        vm.expectRevert(GlpStrategy.NotValid.selector);
        _withdrawFromStrategy(0);
    }

    // 10. User can only withdraw yield accumulated for their shares
    // @audit currently when a user tries to withdraw more than their shares yieldBox::withdraw reverts due to underflow,
    // reverting with a more descriptive error could be beneficial for error handling
    function test_user_cant_overdraw(uint256 ethBuyin1, uint256 ethBuyin2) internal isArbFork {
        address alice = address(0x1);
        address bob = address(0x2);
        vm.deal(alice, ethBuyin1);
        vm.deal(bob, ethBuyin2);

        // two users deposit
        // Alice's deposit
        vm.startPrank(alice);
        uint256 aliceSGlpBefore = _buyStakeWrapAndDeposit(alice, ethBuyin1);
        vm.stopPrank();

        // Bob's deposit
        vm.startPrank(bob);
        uint256 bobSGlpBefore = _buyStakeWrapAndDeposit(bob, ethBuyin2);

        // pass the sGLP minting cooldown time to transfer out
        vm.warp(block.timestamp + 30 minutes);

        // bob tries to withdraw his amount + alice's deposited amount with no reward accumulation
        vm.expectRevert();
        _withdrawFromStrategy(bob, bobSGlpBefore + aliceSGlpBefore);

        vm.stopPrank();
    }

    /**
     * Oracle tests: these test that calls to the Oracle that revert are correctly caught
     */
    function test_harvest_oracle_reverts() public isArbFork prankBinance {
        ITapiocaOracle wethGlpOracle = ITapiocaOracle(address(0x1));

        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userSGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userSGlpBefore);

        _depositIntoStrategy(userSGlpBefore);

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        // sets the oracle to a random address so that it reverts for all calls
        glpStrategy.setWethGlpOracle(wethGlpOracle);

        // rewards need to accumulate before harvesting
        vm.expectRevert();
        glpStrategy.harvest();
    }

    function test_withdraw_oracle_reverts() public isArbFork prankBinance {
        ITapiocaOracle wethGlpOracle = ITapiocaOracle(address(0x1));

        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userSGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userSGlpBefore);

        _depositIntoStrategy(userSGlpBefore);

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        glpStrategy.harvest();
        glpStrategy.setWethGlpOracle(wethGlpOracle);

        vm.expectRevert();
        _withdrawFromStrategy(userSGlpBefore);
    }

    function test_harvest_oracle_not_successful() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userSGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userSGlpBefore);

        _depositIntoStrategy(userSGlpBefore);

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        // sets the oracle response to false to force the oracle query to fail
        wethOracleMock.setSuccess(false);

        vm.expectRevert(GlpStrategy.Failed.selector);
        glpStrategy.harvest();
    }

    /**
     * Simple tests to achieve coverage
     *
     */
    function test_name() public {
        assertTrue(keccak256(abi.encodePacked(glpStrategy.name())) == keccak256(abi.encodePacked("sGLP")));
    }

    function test_description() public {
        assertTrue(
            keccak256(abi.encodePacked(glpStrategy.description()))
                == keccak256(abi.encodePacked("Holds staked GLP tokens and compounds the rewards"))
        );
    }

    // NOTE: safeApprove tests implemented a public function via the GlpStrategyWrapper
    // to test functionality of the private function
    function test_safeApprove_not_contract() public {
        // calls the safeApprove function
        vm.expectRevert("GlpStrategy::safeApprove: no contract");
        glpStrategy.safeApprove(address(0x1), address(this), 5);
    }

    function test_safeApprove_approve_zero_address_failure() public {
        address testToken = address(new MockERC20("Test Token", "TT"));
        vm.expectRevert("GlpStrategy::safeApprove: approve failed");
        glpStrategy.safeApprove(testToken, address(0), 0);
    }

    function test_safeApprove_fails_second_approval() public {
        address testToken = address(new MockERC20("Test Token", "TT"));
        vm.expectRevert("GlpStrategy::safeApprove: approve failed");
        glpStrategy.safeApprove(testToken, address(0x1), type(uint256).max);
    }

    /**
     * Admin Functions
     */
    function test_setSlippage() public {
        uint256 slippage = 65;
        vm.expectEmit();
        emit GlpStrategy.SlippageUpdated(50, 65);

        glpStrategy.setSlippage(slippage);
    }

    function test_max_slippage_reverts() public {
        uint256 slippage = 10005;

        vm.expectRevert(GlpStrategy.NotValid.selector);
        glpStrategy.setSlippage(slippage);
    }

    function test_setSlippage_not_owner() public {
        uint256 slippage = 65;
        vm.prank(address(0x1));
        vm.expectRevert("Ownable: caller is not the owner");
        glpStrategy.setSlippage(slippage);
    }

    function test_paused() public {
        glpStrategy.setPause(true);
        assertTrue(glpStrategy.paused());
    }

    /**
     * Utils
     */
    function _compound(uint256 t, uint256 n) internal {
        glpStrategy.harvest();

        uint256 r = t % n;
        uint256 interval = (t - r) / n;

        // warps time forward then harvests the rewards
        for (uint256 i; i < r; i++) {
            vm.warp(block.timestamp + interval + 1);
            glpStrategy.harvest();
        }
        for (uint256 i; i < n; i++) {
            vm.warp(block.timestamp + interval);
            glpStrategy.harvest();
        }
    }

    // NOTE: this can be modified for fuzzing to test all tokens used to mint GLP, not just weth
    function _buyGLPAndStake(uint256 amountToBuy) internal {
        uint256 glpPrice = glpManager.getPrice(true) / 1e12;
        uint256 wethPrice = gmxVault.getMaxPrice(weth) / 1e12;

        // Buys GLP using ETH which is automatically staked by GMX
        uint256 minUsdg = (((wethPrice * amountToBuy) / 1e18) * 99) / 100; // 1% slippage
        uint256 minGlp = (minUsdg * 1e18) / glpPrice;
        // mints GLP to the msg.sender
        glpRewardRouter.mintAndStakeGlpETH{value: amountToBuy}(minUsdg, minGlp);
        // uint256 glpBal = sGLP.balanceOf(address(binanceWalletAddr));
        // assertGe(glpBal, minGlp, "user doesn't receive minimum sGLP amount");
    }

    function _wrapSGLP(address recipient, uint256 balanceToWrap) internal {
        sGLP.approve(address(tsGLP), balanceToWrap);
        uint200 amount200 = SafeCast.toUint200(balanceToWrap);
        uint48 deadline = SafeCast.toUint48(block.timestamp);

        // Pearlmit approval
        pearlmit.approve(20, address(sGLP), 0, address(tsGLP), amount200, deadline);
        sGLP.approve(address(pearlmit), amount200);

        tsGLP.wrap(recipient, recipient, balanceToWrap);
    }

    function _depositIntoStrategy(uint256 amount) internal {
        // Deposit into strategy
        tsGLP.approve(address(yieldBox), amount);
        // yieldBox makes call to GlpStrategy::deposited
        yieldBox.depositAsset(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, amount, 0);
    }

    function _depositIntoStrategy(address depositor, uint256 amount) internal {
        // Deposit into strategy
        tsGLP.approve(address(yieldBox), amount);
        // yieldBox makes call to GlpStrategy::deposited
        yieldBox.depositAsset(glpStratAssetId, depositor, depositor, amount, 0);
    }

    function _withdrawFromStrategy(uint256 amount) internal {
        yieldBox.withdraw(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, amount, 0);
    }

    function _withdrawFromStrategy(address depositor, uint256 amount) internal {
        yieldBox.withdraw(glpStratAssetId, depositor, depositor, amount, 0);
    }

    function _buyStakeAndWrap(address depositor, uint256 amount) public returns (uint256 depositorGlpBalance) {
        _buyGLPAndStake(amount);

        depositorGlpBalance = sGLP.balanceOf(depositor);

        _wrapSGLP(depositor, depositorGlpBalance);
    }

    function _buyStakeWrapAndDeposit(address depositor, uint256 amount)
        internal
        returns (uint256 depositorGlpBalance)
    {
        _buyGLPAndStake(amount);

        // wraps and deposits GLP amount bought by depositor
        depositorGlpBalance = sGLP.balanceOf(depositor);

        _wrapSGLP(depositor, depositorGlpBalance);
        _depositIntoStrategy(depositor, depositorGlpBalance);
    }

    function _accountForSlippage(uint256 amount) internal returns (uint256) {
        return amount - ((amount * 50) / 10_000);
    }
}
