// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// Tapioca
import {IStargateV2Staking} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Staking.sol";
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";
import {IStargateV2Pool} from "tapioca-strategies/interfaces/stargatev2/IStargateV2Pool.sol";
import {ITapiocaOracle} from "tap-utils/interfaces/periph/ITapiocaOracle.sol";
import {IZeroXSwapper} from "tap-utils/interfaces/periph/IZeroXSwapper.sol";
import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";

// tests
import {StargateV2_Shared} from "../../../shared/StargateV2_Shared.t.sol";

contract StargateV2Strategy_constructor is StargateV2_Shared {
    function test_WhenStrategyIsCreatedWithTheRightParameters() external isArbFork {
        // it should have the right pool
        assertEq(address(strat.pool()), address(pool));
        // it should have the right farm
        assertEq(address(strat.farm()), address(farm));
        // it should have the right inputToken
        assertEq(address(strat.inputToken()), address(usdc));
        // it should have the right lpToken
        assertEq(address(strat.lpToken()), pool.lpToken());
        // it should have the right stgInputTokenOracle
        assertEq(address(strat.stgInputTokenOracle()), address(stgOracle));
        // it should have the right arbInputTokenOracle
        assertEq(address(strat.arbInputTokenOracle()), address(arbOracle));
        // it should have the right swapper
        assertEq(address(strat.swapper()), address(swapper));
        // it should transfer the ownership to the righ account
        assertEq(address(strat.owner()), address(this));
    }

    modifier whenPoolIsNotValid(bool _zero) {
        pool = IStargateV2Pool(_zero ? address(0) : address(0x1));
        _;
    }

    modifier whenFarmIsNotValid() {
        farm = IStargateV2Staking(address(0));
        _;
    }

    function test_RevertWhen_PoolIsAddressZero() external whenPoolIsNotValid(true) {
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        new StargateV2Strategy(
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
            address(this)
        );
    }

    function test_RevertWhen_PoolIsNotTheRightType() external whenPoolIsNotValid(false) {
        // will revert because pool.lpToken() call will throw an EvmError
        vm.expectRevert();
        new StargateV2Strategy(
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
            address(this)
        );
    }

    function test_RevertWhen_FarmIsNotValid() external whenFarmIsNotValid {
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        new StargateV2Strategy(
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
            address(this)
        );
    }
}
