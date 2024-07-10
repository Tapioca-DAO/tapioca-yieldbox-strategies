// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import {GlpStrategy} from "../../contracts/glp/GlpStrategy.sol";
import {IGmxRewardRouterV2} from "tapioca-strategies/interfaces/gmx/IGmxRewardRouter.sol";
import {IGmxRewardTracker} from "tapioca-strategies/interfaces/gmx/IGmxRewardTracker.sol";
import {ITapiocaOracle} from "tapioca-periph/interfaces/periph/ITapiocaOracle.sol";
import {IGlpManager} from "tapioca-strategies/interfaces/gmx/IGlpManager.sol";
import {IGmxVester} from "tapioca-strategies/interfaces/gmx/IGmxVester.sol";
import {BaseERC20Strategy} from "yieldbox/strategies/BaseStrategy.sol";
import {IYieldBox} from "yieldbox/interfaces/IYieldBox.sol";
import {ITOFT} from "tapioca-periph/interfaces/oft/ITOFT.sol";
import "forge-std/console2.sol";

/// @notice This contract is used to wrap the GlpStrategy with extra functionality for testing internal functions,
///         and is what's targeted during testing
contract GlpStrategyWrapper is GlpStrategy {
    constructor(
        IYieldBox _yieldBox,
        IGmxRewardRouterV2 _gmxRewardRouter,
        IGmxRewardRouterV2 _glpRewardRouter,
        ITOFT _tsGlp,
        ITapiocaOracle _wethGlpOracle,
        bytes memory _wethGlpOracleData,
        address _owner
    ) GlpStrategy(_yieldBox, _gmxRewardRouter, _glpRewardRouter, _tsGlp, _wethGlpOracle, _wethGlpOracleData, _owner) {}

    function safeApprove(address token, address to, uint256 value) public {
        _safeApprove(token, to, value);
    }

    function setWethGlpOracle(ITapiocaOracle _wethGlpOracle) public {
        wethGlpOracle = _wethGlpOracle;
    }
}
