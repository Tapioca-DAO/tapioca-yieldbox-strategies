// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// External
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Tapioca 
import {IStargateV2MultiRewarder} from "tapioca-strategies/interfaces/stargatev2/IStargateV2MultiRewarder.sol";
import {YieldBox, YieldBoxURIBuilder, IWrappedNative, TokenType, IStrategy} from "yieldbox/YieldBox.sol";
import {IStargateV2Staking} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Staking.sol";
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";
import {IStargateV2Pool} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Pool.sol";
import {Pearlmit, IPearlmit, PearlmitHash} from "tapioca-periph/pearlmit/Pearlmit.sol";
import {ITapiocaOracle} from "tapioca-periph/interfaces/periph/ITapiocaOracle.sol";
import {IZeroXSwapper} from "tapioca-periph/interfaces/periph/IZeroXSwapper.sol";
import {BaseERC20Strategy} from "yieldbox/strategies/BaseStrategy.sol";
import {ICluster} from "tapioca-periph/interfaces/periph/ICluster.sol";
import {ZeroXSwapper} from "tapioca-periph/Swapper/ZeroXSwapper.sol";
import {ITOFT} from "tapioca-periph/interfaces/oft/ITOFT.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";
import {Cluster} from "tapioca-periph/Cluster/Cluster.sol";
import {OracleMock} from "tapioca-mocks/OracleMock.sol";

import {ZeroXSwapperMockTarget} from "tapioca-strategies/mocks/ZeroXSwapperMockTarget.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";

import "forge-std/Test.sol";


contract StargateV2StrategyTest is Test { 
    address owner;
    string constant ENV_BINANCE_WALLET_ADDRESS = "BINANCE_WALLET_ADDRESS";
    string constant ENV_POOL_ADDRESS = "STARGATEV2_POOL";
    string constant ENV_FARM_ADDRESS = "STARGATEV2_FARM";
    string constant ENV_USDC = "USDC";
    string constant ENV_WETH = "WETH";
    string constant RPC_URL = "RPC_URL";
    string constant FORKING_BLOCK_NUMBER = "FORKING_BLOCK_NUMBER";
    uint256 ARB_FORK;



    address public binanceWalletAddr;
    address public weth;
    address public usdc;
    IStargateV2Pool pool;
    IStargateV2Staking farm;
    OracleMock public stgOracleMock;
    OracleMock public arbOracleMock;
    ToftMock tUsdc;
    StargateV2Strategy strat;
    ZeroXSwapperMockTarget swapperTarget;
    ZeroXSwapper swapper;
    Cluster cluster;
    YieldBox yieldBox;
    Pearlmit pearlmit;
    uint256 tUsdcAssetId;

    /**
    * Modifiers
    */
    modifier isArbFork() {
        vm.selectFork(ARB_FORK);
        _;
    }
    function setUp() public {
        string memory rpcUrl = vm.envString(RPC_URL);
        uint256 forkingBlockNumber = vm.envUint(FORKING_BLOCK_NUMBER);
        ARB_FORK = vm.createSelectFork(rpcUrl, forkingBlockNumber);

        binanceWalletAddr = vm.envAddress(ENV_BINANCE_WALLET_ADDRESS);
        vm.label(binanceWalletAddr, "binanceWalletAddr");
        weth = vm.envAddress(ENV_WETH);
        vm.label(weth, "weth");
        usdc = vm.envAddress(ENV_USDC);
        vm.label(usdc, "usdc");
        pool = IStargateV2Pool(vm.envAddress(ENV_POOL_ADDRESS));
        vm.label(address(pool), "IStargateV2Pool");
        farm = IStargateV2Staking(vm.envAddress(ENV_FARM_ADDRESS));
        vm.label(address(farm), "IStargateV2Staking");

        pearlmit = new Pearlmit("Test", "1", address(this), 0);
        stgOracleMock = new OracleMock("stgOracleMock", "SOM", 1e18);
        arbOracleMock = new OracleMock("arbOracleMock", "SOM", 1e18);
        tUsdc = new ToftMock(address(usdc), "Toft", "TOFT");
        tUsdc.setPearlmit(IPearlmit(address(pearlmit)));
        yieldBox = new YieldBox(IWrappedNative(address(weth)), new YieldBoxURIBuilder());
        cluster = new Cluster(0, address(this));
        swapperTarget = new ZeroXSwapperMockTarget();
        swapper = new ZeroXSwapper(address(swapperTarget), ICluster(address(cluster)), address(this));

        strat = new StargateV2Strategy(
        IYieldBox(address(yieldBox)),
        ICluster(address(cluster)),
        address(tUsdc),
        address(pool),
        address(farm),
        ITapiocaOracle(address(stgOracleMock)),
        "0x",
        ITapiocaOracle(address(arbOracleMock)),
        "0x",
        IZeroXSwapper(address(swapper)),
        address(this)
        );
        vm.label(address(strat), "StrategyV2Strategy");

        yieldBox.registerAsset(TokenType.ERC20, address(tUsdc), IStrategy(address(strat)), 0);
        tUsdcAssetId = yieldBox.ids(TokenType.ERC20, address(tUsdc), IStrategy(address(strat)), 0);
    }

    /**
     * Tests
     */
    function test_constructor_stg() public isArbFork {
        assertEq(address(strat.pool()), address(pool));
        assertEq(address(strat.farm()), address(farm));
        assertEq(strat.contractAddress(), address(tUsdc));
        assertEq(address(strat.inputToken()), address(usdc));
    }

    function test_deposit_stg() public isArbFork {
        uint256 amount = 10_000_000; // 10 USDC

        _deposit(amount);

        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, amount);
    }

    function test_withdraw_stg() public isArbFork {
        uint256 amount = 10_000_000; // 10 USDC

        _deposit(amount);

        // make sure it was deposited
        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, amount);


        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), amount, 0);
        uint256 tUsdcBalance = tUsdc.balanceOf(address(this));
        assertEq(tUsdcBalance, amount);

        farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, 0);
    }

    function test_claim_stg() public isArbFork {
        uint256 amount = 10_000_000; // 10 USDC

        _deposit(amount);

        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, amount);

        vm.warp(1921684352);

        address[] memory tokens = new address[](1);
        tokens[0] = address(strat.lpToken());
        strat.claim(tokens);

        address stg = strat.STG();
        address arb = strat.ARB();
        uint256 stgBalance = IERC20(stg).balanceOf(address(strat));
        uint256 arbBalance = IERC20(arb).balanceOf(address(strat));

        bool arbOrStgRewards = stgBalance > 0 || arbBalance > 0;
        assertTrue(arbOrStgRewards);
    }

    function test_invest_stg() public isArbFork {
        uint256 amount = 10_000_000; // 10 USDC

        _deposit(amount);

        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, amount);

        vm.warp(1921684352);

        address[] memory tokens = new address[](1);
        tokens[0] = address(strat.lpToken());
        strat.claim(tokens);

        address stg = strat.STG();
        address arb = strat.ARB();
        uint256 stgBalance = IERC20(stg).balanceOf(address(strat));
        uint256 arbBalance = IERC20(arb).balanceOf(address(strat));

        bool arbOrStgRewards = stgBalance > 0 || arbBalance > 0;
        assertTrue(arbOrStgRewards);


        //arb swap data
        IZeroXSwapper.SZeroXSwapData memory arbZeroXSwapData = IZeroXSwapper.SZeroXSwapData({
            sellToken: IERC20(arb),
            buyToken: IERC20(address(usdc)),
            swapTarget: payable(swapperTarget),
            swapCallData: abi.encodeWithSelector(ZeroXSwapperMockTarget.transferTokens.selector, address(usdc), arbBalance/1e12)
        });

        vm.prank(binanceWalletAddr);
        IERC20(usdc).transfer(address(swapperTarget), 10_000_000_000);

        IZeroXSwapper.SZeroXSwapData memory stgZeroXSwapData = IZeroXSwapper.SZeroXSwapData({
            sellToken: IERC20(stg),
            buyToken: IERC20(address(usdc)),
            swapTarget: payable(swapperTarget),
            swapCallData: abi.encodeWithSelector(ZeroXSwapperMockTarget.transferTokens.selector, address(usdc), stgBalance/1e12)
        });

        StargateV2Strategy.SSwapData memory stgSwapData = StargateV2Strategy.SSwapData({
            minAmountOut: 0,
            data: stgZeroXSwapData
        });

        StargateV2Strategy.SSwapData memory arbSwapData = StargateV2Strategy.SSwapData({
            minAmountOut: 0,
            data: arbZeroXSwapData
        });

        uint256 farmBalanceBefore = farm.balanceOf(address(strat.lpToken()), address(strat));

        cluster.updateContract(0, address(strat), true);
        strat.invest(abi.encode(arbSwapData), abi.encode(stgSwapData));

        uint256 farmBalanceAfter = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertGt(farmBalanceAfter, farmBalanceBefore);
    }

    function test_emergencyWithdraw_stg() public isArbFork {
        uint256 amount = 10_000_000; // 10 USDC

        _deposit(amount);

        // make sure it was deposited
        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, amount);

        assertFalse(strat.withdrawPaused());
        assertFalse(strat.depositPaused());
        strat.emergencyWithdraw();
        assertTrue(strat.withdrawPaused());
        assertTrue(strat.depositPaused());

        uint256 tUsdcBalance = tUsdc.balanceOf(address(strat));
        assertGt(tUsdcBalance, 0);

        vm.expectRevert();
        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), amount, 0);

        strat.setPause(false, StargateV2Strategy.PauseType.Withdraw);

        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), amount, 0);

        tUsdcBalance = tUsdc.balanceOf(address(this));
        assertEq(tUsdcBalance, amount);

        farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, 0);
    }




    function _deposit(uint256 amount) private {
        vm.prank(binanceWalletAddr);
        IERC20(usdc).transfer(address(this), amount);

        IERC20(usdc).approve(address(pearlmit), type(uint256).max);
        pearlmit.approve(20, address(usdc), 0, address(tUsdc), type(uint200).max, uint48(block.timestamp));
        tUsdc.wrap(address(this), address(this), amount);

        IERC20(tUsdc).approve(address(yieldBox), type(uint256).max);
        yieldBox.depositAsset(tUsdcAssetId, address(this), address(this), amount, 0);

    }
}
