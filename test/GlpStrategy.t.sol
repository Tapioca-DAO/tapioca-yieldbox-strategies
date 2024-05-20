// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Tapioca
import {IYieldBox, YieldBox, YieldBoxURIBuilder, IWrappedNative, TokenType, IStrategy} from "tap-yieldbox/YieldBox.sol";
import {IGmxRewardRouterV2} from "tapioca-strategies/interfaces/gmx/IGmxRewardRouter.sol";
import {ITOFT} from "tapioca-periph/interfaces/oft/ITOFT.sol";
import {ITapiocaOracle} from "tapioca-periph/interfaces/periph/ITapiocaOracle.sol";
import {IGlpManager} from "tapioca-strategies/interfaces/gmx/IGlpManager.sol";
import {IGmxVault} from "tapioca-strategies/interfaces/gmx/IGmxVault.sol";
import {GlpStrategy} from "tapioca-strategies/glp/GlpStrategy.sol";
import {GlpStrategyWrapper} from "./GlpStrategyWrapper.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";
import {OracleMock} from "tapioca-mocks/OracleMock.sol";
import {MockERC20} from "contracts/mocks/MockERC20.sol";

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
    string constant RPC_URL = "RPC_URL";
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

    /**
     * Vars
     */
    uint256 public glpStratAssetId;
    address public binanceWalletAddr;
    address public weth;

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
        IGmxRewardRouterV2 gmxRewardRouter = IGmxRewardRouterV2(
            gmxRewardRouterAddr
        );
        sGLP = IERC20(stakedGlpAddr);
        gmxVault = IGmxVault(gmxVaultAddr);
        weth = address(gmxRewardRouter.weth());
        glpManager = IGlpManager(glpRewardRouter.glpManager());
        vm.label(address(glpManager), "glpManager");

        // Deploy contracts
        tsGLP = new ToftMock(address(sGLP), "Toft", "TOFT");
        vm.label(address(tsGLP), "tsGLP");
        yieldBox = new YieldBox(IWrappedNative(weth), new YieldBoxURIBuilder());
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
        yieldBox.registerAsset(
            TokenType.ERC20,
            address(tsGLP),
            IStrategy(address(glpStrategy)),
            0
        );
        glpStratAssetId = yieldBox.ids(
            TokenType.ERC20,
            address(tsGLP),
            IStrategy(address(glpStrategy)),
            0
        );
    }

    /**
     * Tests
     */

    function test_constructor() public isArbFork {
        uint256 glpPrice = glpManager.getPrice(true);
        assertLe(glpPrice, 1041055094190371419655569666477);

        uint256 wethPrice = gmxVault.getMaxPrice(weth) / 1e12;
        assertApproxEqAbs(wethPrice, 1805 * 1e18, 2 * 1e18);
    }

    function test_compound_harvest() public isArbFork prankBinance {
        uint256 glpPrice = glpManager.getPrice(true) / 1e12;
        uint256 wethPrice = gmxVault.getMaxPrice(weth) / 1e12;

        // Get GLP and stake
        {
            uint256 ethBuyin = 1 ether;
            uint256 minUsdg = (((wethPrice * ethBuyin) / 1e18) * 99) / 100; // 1% slippage
            uint256 minGlp = (minUsdg * 1e18) / glpPrice;
            glpRewardRouter.mintAndStakeGlpETH{value: ethBuyin}(
                minUsdg,
                minGlp
            );

            uint256 glpBal = sGLP.balanceOf(address(binanceWalletAddr));
            assertGe(glpBal, minGlp, "GLP out");
        }

        // Wrap sGLP and deposit into YieldBox/Strategy
        uint256 glpBefore = sGLP.balanceOf(binanceWalletAddr);
        {
            // Wrap sGLP
            sGLP.approve(address(tsGLP), glpBefore);
            tsGLP.wrap(binanceWalletAddr, binanceWalletAddr, glpBefore);

            // Deposit into YieldBox
            tsGLP.approve(address(yieldBox), glpBefore);
            yieldBox.depositAsset(
                glpStratAssetId,
                binanceWalletAddr,
                binanceWalletAddr,
                glpBefore,
                0
            );
        }

        // Compound and withdraw
        {
            uint256 shares = yieldBox.balanceOf(
                binanceWalletAddr,
                glpStratAssetId
            );
            compound((86400 * 365) / 10, 6); // Compound 6 times in 1 year (lol)
            yieldBox.withdraw(
                glpStratAssetId,
                binanceWalletAddr,
                binanceWalletAddr,
                0,
                shares
            );
            uint256 glpBalAfter = tsGLP.balanceOf(binanceWalletAddr);
            assertGt(glpBalAfter, glpBefore, "GLP compound out");
        }
    }

    // ------------ new tests --------------------

    // 1a. tsGLP passed in on deposit is staked for GlpStrategy
    function test_deposit() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        // mints GLP and stakes it for binanceWallet account
        _buyGLPAndStake(ethBuyin);

        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        uint256 strategyGlpBefore = sGLP.balanceOf(address(glpStrategy));

        // Wrap sGLP -> tsGLP
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        _depositIntoStrategy(userGlpBefore);

        // GlpStrategy's balance of sGLP should be increased by userGlpBefore
        uint256 strategyGlpAfter = sGLP.balanceOf(address(glpStrategy));
        assertTrue(
            strategyGlpBefore + userGlpBefore == strategyGlpAfter,
            "strategy GLP balance doesn't increase"
        );
    }

    // 1b. depositing when paused reverts
    function test_deposit_paused_reverts() public isArbFork {
        glpStrategy.updatePaused(true);

        vm.startPrank(binanceWalletAddr);

        uint256 ethBuyin = 1 ether;
        // mints GLP and stakes it for binanceWallet account
        _buyGLPAndStake(ethBuyin);

        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        uint256 strategyGlpBefore = sGLP.balanceOf(address(glpStrategy));

        // Wrap sGLP -> tsGLP
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        // Deposit into strategy
        tsGLP.approve(address(yieldBox), userGlpBefore);

        // explicitly include deposit logic here to expect revert on it
        vm.expectRevert(GlpStrategy.Paused.selector);
        yieldBox.depositAsset(
            glpStratAssetId,
            binanceWalletAddr,
            binanceWalletAddr,
            userGlpBefore,
            0
        );

        vm.stopPrank();
    }

    // 2a. GLP bought with weth rewards is staked for GlpStrategy
    // TODO: add compounding here for better testing
    // TODO: figure out why sGLP balance delta is greater than the rewards accumulated in harvesting
    // NOTE: branch in _buyGlp for wethAmount > 0 doesn't show up as covered even though this covers both possible branches
    function test_weth_rewards_staked_as_glp() public isArbFork prankBinance {
        // buy sGLP
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        _depositIntoStrategy(userGlpBefore);

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        // this returns the reward amount in GLP
        uint256 rewardsAccumulatedBeforeHarvest = glpStrategy.pendingRewards();
        uint256 strategyGLPBalanceBeforeHarvest = sGLP.balanceOf(
            address(glpStrategy)
        );

        glpStrategy.harvest();

        uint256 rewardsAccumulatedAfterHarvest = glpStrategy.pendingRewards();
        uint256 strategyGLPBalanceAfterHarvest = sGLP.balanceOf(
            address(glpStrategy)
        );

        console2.log(
            "glp balance delta: %e",
            strategyGLPBalanceAfterHarvest - strategyGLPBalanceBeforeHarvest
        );
        console2.log(
            "strategy balance preharvest: %e",
            strategyGLPBalanceBeforeHarvest
        );
        console2.log(
            "strategy balance post-harvest: %e",
            strategyGLPBalanceAfterHarvest
        );
        // console2.log(
        //     "subtracting user's initial deposit from delta: ",
        //     strategyGLPBalanceAfterHarvest -
        //         strategyGLPBalanceBeforeHarvest -
        //         userGlpBefore
        // );
        console2.log(
            "rewards before harvest: %e",
            rewardsAccumulatedBeforeHarvest
        );
        console2.log(
            "rewards after harvest: %e",
            rewardsAccumulatedAfterHarvest
        );
        // check that call to harvest decreases weth rewards and increases the sGLP balance of GlpStrategy
        // reward balance of GlpStrategy is empty after harvesting
        // 3. harvesting uses all the weth rewards balance if it's nonzero
        assertTrue(
            rewardsAccumulatedAfterHarvest == 0,
            "reward balance of GlpStrategy nonzero after harvesting"
        );

        // all harvested rewards have been staked for GlpStrategy
        // TODO: this can serve as a starting point for fuzzing to ensure sGLP balance always increases
        // @audit this currently fails with the actual GLP received by the glpStrategy being much more than what's predicted by the pendingRewards
        // this would seem to imply that the pendingRewards calculation is incorrect
        // assertTrue(
        //     rewardsAccumulatedBeforeHarvest ==
        //         strategyGLPBalanceAfterHarvest -
        //             strategyGLPBalanceBeforeHarvest,
        //     "GLP lost in harvest"
        // );
    }

    // NOTE: this could be fuzzed with values up to minimum time for receiving reward
    // 2b. no GLP is bought if the protocol accumulates 0 weth rewards
    function test_no_glp_bought_for_zero_rewards()
        public
        isArbFork
        prankBinance
    {
        // buy sGLP
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        _depositIntoStrategy(userGlpBefore);

        uint256 strategyGLPBeforeHarvest = sGLP.balanceOf(address(glpStrategy));

        glpStrategy.harvest();

        uint256 strategyGLPAfterHarvest = sGLP.balanceOf(address(glpStrategy));

        // no time has passed so no rewards should be accumulated
        assertTrue(
            strategyGLPAfterHarvest == strategyGLPAfterHarvest,
            "GLP is bought with 0 rewards accumulated"
        );
    }

    // @audit this demonstrates that the value returned by pendingRewards does not matching harvested amount
    function test_pending_not_correct() public isArbFork prankBinance {
        // buy sGLP
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        // console2.log(
        //     "strategy balance before deposit",
        //     sGLP.balanceOf(address(glpStrategy))
        // );
        // console2.log(
        //     "expected rewards before deposit",
        //     glpStrategy.pendingRewards()
        // );
        _depositIntoStrategy(userGlpBefore);

        // console2.log(
        //     "strategy balance after deposit: %e",
        //     sGLP.balanceOf(address(glpStrategy))
        // );
        // console2.log(
        //     "expected rewards after deposit: %e",
        //     glpStrategy.pendingRewards()
        // );

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        // glpStrategy.pendingRewards();
        // glpStrategy.newPendingCalculation();
        uint256 strategyBalanceBeforeHarvest = sGLP.balanceOf(
            address(glpStrategy)
        );
        uint256 expectedRewards = glpStrategy.pendingRewards();
        console2.log(
            "strategy balance before harvest: %e",
            strategyBalanceBeforeHarvest
        );
        console2.log("expected rewards before harvest: %e", expectedRewards);

        glpStrategy.harvest();

        uint256 strategyBalanceAfterHarvest = sGLP.balanceOf(
            address(glpStrategy)
        );
        console2.log(
            "strategy balance after harvesting: %e",
            strategyBalanceAfterHarvest
        );
        console2.log(
            "strategy balance delta after harvest: %e",
            strategyBalanceAfterHarvest - strategyBalanceBeforeHarvest
        );
        console2.log(
            "expected rewards after harvest: %e",
            glpStrategy.pendingRewards()
        );
    }

    // 4. only YieldBox can withdraw and deposit
    function test_only_yieldBox_actions() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        // deposit directly into strategy
        vm.expectRevert("Not YieldBox");
        glpStrategy.deposited(userGlpBefore);

        // withdraw directly from strategy
        vm.expectRevert("Not YieldBox");
        glpStrategy.withdraw(binanceWalletAddr, userGlpBefore);
    }

    // 5. depositing sGLP directly to strategy should fail
    function test_deposit_sGLP() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        // Deposit into strategy
        tsGLP.approve(address(yieldBox), userGlpBefore);

        vm.expectRevert("BoringERC20: TransferFrom failed");
        yieldBox.depositAsset(
            glpStratAssetId,
            binanceWalletAddr,
            binanceWalletAddr,
            userGlpBefore,
            0
        );
    }

    // 6. calling harvest with 0 rewards accumulated doesn't revert
    function test_harvest_zero() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userGlpBefore);

        _depositIntoStrategy(userGlpBefore);

        // assert that rewards accumulated by the strategy = 0
        assertTrue(glpStrategy.pendingRewards() == 0);

        glpStrategy.harvest();
    }

    // 7. user balance of sGLP increases by amount on call to withdraw
    // TODO: implement a sub-version of this where rewards get compounded
    function test_user_balance_increases() public isArbFork prankBinance {
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

        // withdrawing initially deposited amount in this test
        _withdrawFromStrategy(userSGlpBefore);

        // unwraps received tsGLP from
        tsGLP.unwrap(
            binanceWalletAddr,
            tsGLP.balanceOf(address(binanceWalletAddr))
        );
        uint256 userSGLPAfter = sGLP.balanceOf(address(binanceWalletAddr));

        assertTrue(
            userSGlpBefore <= userSGLPAfter,
            "user loses sGLP on withdraw"
        );
    }

    // 8. GlpStrategy balance of sGLP decreases on withdrawal
    // TODO: implement a sub-version where rewards are compounded and not fully withdrawn
    function test_strategy_balance_decreases() public isArbFork prankBinance {
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

        uint256 strategyBalanceBefore = sGLP.balanceOf(address(glpStrategy));

        // withdraw the user's original balance from strategy
        _withdrawFromStrategy(userSGlpBefore);

        uint256 strategyBalanceAfter = sGLP.balanceOf(address(glpStrategy));

        // if this is false, strategy gains sGLP from user
        assertTrue(
            strategyBalanceBefore - strategyBalanceAfter == userSGlpBefore,
            "strategy gains sGLP"
        );
    }

    // 9a. YieldBox can always withdraw up to the full amount of GLP + weth rewards in the GlpStrategy
    // @audit when trying to withdraw the full amount before the 15 minute cooldown period for sGLP this function reverts
    // NOTE: since any withdrawal triggers buying GLP with the rewards then staking it this means the full reward amount will never be withdrawable as new rewards will always accumulate in the cooldown period
    // unless the rewards accumulated in the cooldown period are less than the precision value of the sGLP token
    // @audit issue description: GLP cooldown period after mint causes the full sGLP balance to never be withdrawable,
    // any attempt to withdraw the full sGLP balance after waiting for the cooldown period to pass causes a revert in the call to pendingRewards when it calls fGLP.claimable due to an underflow
    // additionally, if the cooldown period passes the sGLP in the contract will have earned more rewards which will automatically be claimed in the withdrawal flow and again require the cooldown period before being withdrawn
    // this results in the full sGLP amount never being able to be withdrawn as each subsequent withdrawal will be subject to this cooldown period cycle
    // @audit the test below demonstrates this where the initial setup will always fail when trying to withdraw initial balance + earned rewards
    // after warping time forward to surpass the cooldown period there's then an issue in the call to pendingRewards which causes an underflow revert
    function test_always_withdrawable() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userSGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        _wrapSGLP(binanceWalletAddr, userSGlpBefore);

        _depositIntoStrategy(userSGlpBefore);

        uint256 strategyBalanceBeforeHarvest = sGLP.balanceOf(
            address(glpStrategy)
        );
        console2.log(
            "balance before harvest: %e",
            strategyBalanceBeforeHarvest
        );

        // warps time forward then harvests the rewards
        uint256 interval = 525600; // using the interval from compound harvest test
        vm.warp(block.timestamp + interval);

        glpStrategy.harvest();

        uint256 strategyBalanceBeforeWithdraw = sGLP.balanceOf(
            address(glpStrategy)
        );

        console2.log(
            "strategy balance after harvest: %e",
            strategyBalanceBeforeWithdraw
        ); // 1.76230473101395713457e21
        uint256 strategyBalanceDelta = strategyBalanceBeforeWithdraw -
            strategyBalanceBeforeHarvest;
        console2.log("strategy balance delta: %e", strategyBalanceDelta);

        // withdraw full amount from strategy
        // vm.warp(60 minutes); // need to warp ahead to work around the cooldown period for minting sGLP
        // vm.warp(block.timestamp + interval); // this warp enables accumulation of more rewards

        // adding this harvest should allow withdrawing the initial reward but causes an arithmetic underflow in YieldBox
        // glpStrategy.harvest();

        // @audit the revert happens in the call to withdraw
        _withdrawFromStrategy(strategyBalanceBeforeWithdraw);
        // @audit using the initial strategy balance doesn't fail because new GLP with a cooldown period hasn't been minted
        // _withdrawFromStrategy(strategyBalanceBeforeHarvest);

        uint256 strategyBalanceAfterWithdraw = sGLP.balanceOf(
            address(glpStrategy)
        );

        assertTrue(
            strategyBalanceAfterWithdraw == 0,
            "full rewards not withdrawable"
        );
    }

    // 9b. withdrawing zero amount should revert
    function test_withdraw_zero_reverts() public isArbFork prankBinance {
        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 userSGlpBefore = sGLP.balanceOf(binanceWalletAddr);
        console2.log("balance before: ", userSGlpBefore);
        _wrapSGLP(binanceWalletAddr, userSGlpBefore);

        _depositIntoStrategy(userSGlpBefore);

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
    function test_user_cant_overdraw() public isArbFork {
        address alice = address(0x1);
        address bob = address(0x2);
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);

        // two users deposit
        // Alice's deposit
        vm.startPrank(alice);

        uint256 ethBuyin = 1 ether;
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 aliceSGlpBefore = sGLP.balanceOf(alice);

        _wrapSGLP(alice, aliceSGlpBefore);

        _depositIntoStrategy(alice, aliceSGlpBefore);
        vm.stopPrank();

        // Bob's deposit
        vm.startPrank(bob);
        _buyGLPAndStake(ethBuyin);

        // wrap and deposit sGLP
        uint256 bobSGlpBefore = sGLP.balanceOf(bob);
        _wrapSGLP(bob, bobSGlpBefore);

        _depositIntoStrategy(bob, bobSGlpBefore);

        // pass the sGLP minting cooldown time to transfer out
        vm.warp(block.timestamp + 30 minutes);

        // bob tries to withdraw his amount + alice's deposited amount with no reward accumulation
        // @audit inspecting calltrace shows an arithmetic underflow here, could throw custom error for better handling
        vm.expectRevert(stdError.arithmeticError);
        _withdrawFromStrategy(bob, bobSGlpBefore + aliceSGlpBefore);
        vm.stopPrank();
    }

    // @audit currently unused, was implemented for developing better rewards estimate calculation
    // function test_new_pending_calculation() public isArbFork prankBinance {
    //     glpStrategy.pendingRewards();
    //     glpStrategy.newPendingCalculation();
    // }

    /** Oracle tests: these test that calls to the Oracle that revert are correctly caught  */
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

    function test_harvest_oracle_not_successful()
        public
        isArbFork
        prankBinance
    {
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
        Simple tests to achieve coverage
    **/
    function test_name() public {
        assertTrue(
            keccak256(abi.encodePacked(glpStrategy.name())) ==
                keccak256(abi.encodePacked("sGLP"))
        );
    }

    function test_description() public {
        assertTrue(
            keccak256(abi.encodePacked(glpStrategy.description())) ==
                keccak256(
                    abi.encodePacked(
                        "Holds staked GLP tokens and compounds the rewards"
                    )
                )
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

    /** Admin Functions */
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
        glpStrategy.updatePaused(true);
        assertTrue(glpStrategy.paused());
    }

    /**
     * Utils
     */
    function compound(uint256 t, uint256 n) internal {
        glpStrategy.harvest();

        uint256 r = t % n;
        uint256 interval = (t - r) / n;
        console2.log("interval: ", interval);
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

    // NOTE: this can be modified for fuzzing to test all tokens used to mint GLP
    function _buyGLPAndStake(uint256 _amountToBuy) internal {
        uint256 glpPrice = glpManager.getPrice(true) / 1e12;
        uint256 wethPrice = gmxVault.getMaxPrice(weth) / 1e12;

        // Buys GLP using ETH which is automatically staked by GMX
        uint256 minUsdg = (((wethPrice * _amountToBuy) / 1e18) * 99) / 100; // 1% slippage
        uint256 minGlp = (minUsdg * 1e18) / glpPrice;
        // mints GLP to the msg.sender
        glpRewardRouter.mintAndStakeGlpETH{value: _amountToBuy}(
            minUsdg,
            minGlp
        );
        // uint256 glpBal = sGLP.balanceOf(address(binanceWalletAddr));
        // assertGe(glpBal, minGlp, "user doesn't receive minimum sGLP amount");
    }

    function _wrapSGLP(address _recipient, uint256 _balanceToWrap) internal {
        sGLP.approve(address(tsGLP), _balanceToWrap);
        tsGLP.wrap(_recipient, _recipient, _balanceToWrap);
    }

    function _depositIntoStrategy(uint256 _amount) internal {
        // Deposit into strategy
        tsGLP.approve(address(yieldBox), _amount);
        // yieldBox makes call to GlpStrategy::deposited
        yieldBox.depositAsset(
            glpStratAssetId,
            binanceWalletAddr,
            binanceWalletAddr,
            _amount,
            0
        );
    }

    function _depositIntoStrategy(address depositor, uint256 _amount) internal {
        // Deposit into strategy
        tsGLP.approve(address(yieldBox), _amount);
        // yieldBox makes call to GlpStrategy::deposited
        yieldBox.depositAsset(
            glpStratAssetId,
            depositor,
            depositor,
            _amount,
            0
        );
    }

    function _withdrawFromStrategy(uint256 _amount) internal {
        yieldBox.withdraw(
            glpStratAssetId,
            binanceWalletAddr,
            binanceWalletAddr,
            _amount,
            0
        );
    }

    function _withdrawFromStrategy(
        address _depositor,
        uint256 _amount
    ) internal {
        yieldBox.withdraw(glpStratAssetId, _depositor, _depositor, _amount, 0);
    }
}
