// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Tapioca
import {IStargateV2Staking} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Staking.sol";
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";
import {IStargateV2Pool} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Pool.sol";
import {ZeroXSwapper} from "tap-utils/Swapper/ZeroXSwapper.sol";
import {TokenType} from "yieldbox/enums/YieldBoxTokenType.sol";

import {ITapiocaOracle} from "tap-utils/interfaces/periph/ITapiocaOracle.sol";
import {IZeroXSwapper} from "tap-utils/interfaces/periph/IZeroXSwapper.sol";
import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";
import {IStrategy} from "yieldbox/interfaces/IStrategy.sol";

// mocks
import {ZeroXSwapperMockTarget} from "tapioca-strategies/mocks/ZeroXSwapperMockTarget.sol";
import {OracleMock} from "tapioca-strategies/mocks/OracleMock.sol";
import {MockERC20} from "tapioca-strategies/mocks/MockERC20.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";

// tests
import {Base_Test} from "../Base_Test.t.sol";
import {Events} from "../utils/Events.sol";

abstract contract StargateV2_Shared is Base_Test, Events {
    // ************ //
    // *** VARS *** //
    // ************ //
    ZeroXSwapperMockTarget swapperTarget;
    OracleMock stgOracle;
    OracleMock arbOracle;
    ToftMock tUsdc;
    uint256 tUsdcAssetId;

    address usdc;
    address binanceWalletAddr;

    StargateV2Strategy strat;

    IStargateV2Pool pool;
    IStargateV2Staking farm;

    ZeroXSwapper swapper;

    function setUp() public virtual override {
        super.setUp();

        string memory rpcUrl = vm.envString(RPC_URL);
        uint256 forkingBlockNumber = vm.envUint(FORKING_BLOCK_NUMBER);
        ARB_FORK = vm.createSelectFork(rpcUrl, forkingBlockNumber);

        binanceWalletAddr = vm.envAddress(ENV_BINANCE_WALLET_ADDRESS);
        vm.label(binanceWalletAddr, "Binance Wallet Address");

        usdc = vm.envAddress(ENV_USDC);
        vm.label(usdc, "UDSC token");

        pool = IStargateV2Pool(vm.envAddress(ENV_POOL_ADDRESS));
        vm.label(address(pool), "IStargateV2Pool");
        farm = IStargateV2Staking(vm.envAddress(ENV_FARM_ADDRESS));
        vm.label(address(farm), "IStargateV2Staking");

        // create TOFT
        tUsdc = _createToft(address(usdc), address(pearlmit));

        // create arb > usdc oracle
        arbOracle = _createOracle("ARBUSDC");
        stgOracle = _createOracle("STGUSDC");

        // create 0xSwapper
        swapperTarget = new ZeroXSwapperMockTarget();
        swapper = _createSwapper(address(swapperTarget), address(cluster), address(this));

        address _owner = address(this);
        // create Stargate v2 strategy
        strat = new StargateV2Strategy(
            IYieldBox(address(yieldBox)),
            ICluster(address(cluster)),
            address(tUsdc),
            address(pool),
            address(farm),
            ITapiocaOracle(address(stgOracle)),
            "0x",
            ITapiocaOracle(address(arbOracle)),
            "0x",
            IZeroXSwapper(address(swapper)),
            _owner
        );
        vm.label(address(strat), "StrategyV2 Strat");

        // register strategy on YieldBox
        yieldBox.registerAsset(TokenType.ERC20, address(tUsdc), IStrategy(address(strat)), 0);
        tUsdcAssetId = yieldBox.ids(TokenType.ERC20, address(tUsdc), IStrategy(address(strat)), 0);
    }

    // ***************** //
    // *** MODIFIERS *** //
    // ***************** //

    function _getToken(address _token, uint256 _amount, address _to) 
        internal 
        resetPrank(binanceWalletAddr) 
    {
        IERC20(_token).transfer(_to, _amount);
    }

    function _getTokenAndWrap(address _token, address _tToken, uint256 _amount) 
        internal 
        whenApprovedViaPearlmit(_token, 0, address(this), _tToken, uint200(_amount), uint48(block.timestamp))
        whenApprovedViaERC20(_token, address(this), address(pearlmit), uint200(_amount))
        resetPrank(address(this))
    {
        _getToken(_token, _amount, address(this));
        _resetPrank(address(this));

        ToftMock(_tToken).wrap(address(this), address(this), _amount);
    }

    
    function _depositToStrategy(uint256 depositAmount) 
        internal
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)
    {
        _getTokenAndWrap(address(usdc), address(tUsdc), depositAmount);
        _resetPrank(address(this));

        vm.expectEmit(true, false, false, false);
        emit AmountDeposited(depositAmount);
        yieldBox.depositAsset(tUsdcAssetId, address(this), address(this), depositAmount, 0);
    }
}
