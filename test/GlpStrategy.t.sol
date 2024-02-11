// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Tapioca
import {
    IYieldBox, YieldBox, YieldBoxURIBuilder, IWrappedNative, TokenType, IStrategy
} from "tap-yieldbox/YieldBox.sol";
import {IGmxRewardRouterV2} from "tapioca-strategies/interfaces/gmx/IGmxRewardRouter.sol";
import {ITapiocaOFTBase} from "tapioca-periph/interfaces/tap-token/ITapiocaOFT.sol";
import {ITapiocaOracle} from "tapioca-periph/interfaces/periph/ITapiocaOracle.sol";
import {IGlpManager} from "tapioca-strategies/interfaces/gmx/IGlpManager.sol";
import {IGmxVault} from "tapioca-strategies/interfaces/gmx/IGmxVault.sol";
import {GlpStrategy} from "tapioca-strategies/glp/GlpStrategy.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";
import {OracleMock} from "tapioca-mocks/OracleMock.sol";

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
    GlpStrategy public glpStrategy;
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

        // Deploy contracts
        tsGLP = new ToftMock(address(sGLP), "Toft", "TOFT");
        vm.label(address(tsGLP), "tsGLP");
        yieldBox = new YieldBox(IWrappedNative(weth), new YieldBoxURIBuilder());
        vm.label(address(yieldBox), "yieldBox");
        wethOracleMock = new OracleMock("wethOracleMock", "WOM", 1e18);

        // Deploy strategy
        glpStrategy = new GlpStrategy(
            IYieldBox(address(yieldBox)),
            gmxRewardRouter,
            glpRewardRouter,
            ITapiocaOFTBase(address(tsGLP)),
            ITapiocaOracle(address(wethOracleMock)),
            "0x",
            address(this)
        );
        vm.label(address(glpStrategy), "glpStrategy");
        yieldBox.registerAsset(TokenType.ERC20, address(tsGLP), IStrategy(address(glpStrategy)), 0);
        glpStratAssetId = yieldBox.ids(TokenType.ERC20, address(tsGLP), IStrategy(address(glpStrategy)), 0);
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
            uint256 minUsdg = ((wethPrice * ethBuyin) / 1e18 * 99) / 100; // 1% slippage
            uint256 minGlp = (minUsdg * 1e18) / glpPrice;
            glpRewardRouter.mintAndStakeGlpETH{value: ethBuyin}(minUsdg, minGlp);

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
            yieldBox.depositAsset(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, glpBefore, 0);
        }

        // Compound and withdraw
        {
            uint256 shares = yieldBox.balanceOf(binanceWalletAddr, glpStratAssetId);
            compound((86400 * 365) / 10, 6); // Compound 6 times in 1 year (lol)
            yieldBox.withdraw(glpStratAssetId, binanceWalletAddr, binanceWalletAddr, 0, shares);
            uint256 glpBalAfter = tsGLP.balanceOf(binanceWalletAddr);
            assertGe(glpBalAfter, glpBefore, "GLP compound out");
        }
    }

    /**
     * Utils
     */
    function compound(uint256 t, uint256 n) internal {
        glpStrategy.harvest();

        uint256 r = t % n;
        uint256 interval = (t - r) / n;
        for (uint256 i; i < r; i++) {
            vm.warp(block.timestamp + interval + 1);
            glpStrategy.harvest();
        }
        for (uint256 i; i < n; i++) {
            vm.warp(block.timestamp + interval);
            glpStrategy.harvest();
        }
    }
}
