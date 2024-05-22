// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import {GlpStrategy} from "../../contracts/glp/GlpStrategy.sol";
import {IGmxRewardRouterV2} from "tapioca-strategies/interfaces/gmx/IGmxRewardRouter.sol";
import {IGmxRewardTracker} from "tapioca-strategies/interfaces/gmx/IGmxRewardTracker.sol";
import {ITapiocaOracle} from "tapioca-periph/interfaces/periph/ITapiocaOracle.sol";
import {IGlpManager} from "tapioca-strategies/interfaces/gmx/IGlpManager.sol";
import {IGmxVester} from "tapioca-strategies/interfaces/gmx/IGmxVester.sol";
import {BaseERC20Strategy} from "tap-yieldbox/strategies/BaseStrategy.sol";
import {IYieldBox} from "tap-yieldbox/interfaces/IYieldBox.sol";
import {ITOFT} from "tapioca-periph/interfaces/oft/ITOFT.sol";
import "forge-std/console2.sol";

// NOTE: this contract is used to wrap the GlpStrategy with extra functionality for testing internal functions
// NOTE: this should be targeted during testing to achieve full coverage
contract GlpStrategyWrapper is GlpStrategy {
    constructor(
        IYieldBox _yieldBox,
        IGmxRewardRouterV2 _gmxRewardRouter,
        IGmxRewardRouterV2 _glpRewardRouter,
        ITOFT _tsGlp,
        ITapiocaOracle _wethGlpOracle,
        bytes memory _wethGlpOracleData,
        address _owner
    )
        GlpStrategy(
            _yieldBox,
            _gmxRewardRouter,
            _glpRewardRouter,
            _tsGlp,
            _wethGlpOracle,
            _wethGlpOracleData,
            _owner
        )
    {}
    function safeApprove(address token, address to, uint256 value) public {
        _safeApprove(token, to, value);
    }

    function setWethGlpOracle(ITapiocaOracle _wethGlpOracle) public {
        wethGlpOracle = _wethGlpOracle;
    }

    // @audit adding in for testing comparison
    // function _calculate_glp_mint(uint256 _amount) internal {
    //      // calculate aum before buyUSDG
    //      uint256 aumInUsdg = getAumInUsdg(true);
    //      uint256 glpSupply = IERC20(glp).totalSupply();

    //     //  IERC20(_token).safeTransferFrom(_fundingAccount, address(vault), _amount);
    //     //  uint256 usdgAmount = vault.buyUSDG(_token, address(this));
    //     //  require(usdgAmount >= _minUsdg, "GlpManager: insufficient USDG output");

    //     // getting usdgAmount from GMX

    //     // usdgAmount is the amount of USDG purchased
    //      uint256 mintAmount = aumInUsdg == 0 ? usdgAmount : usdgAmount.mul(glpSupply).div(aumInUsdg);
    //      require(mintAmount >= _minGlp, "GlpManager: insufficient GLP output");

    //     //  IMintable(glp).mint(_account, mintAmount);
    // }

    // function _getGLPPriceFromGMX() private returns (uint256 price) {
    //     // requires calling GLPManager directly
    //     price = glpManager.getPrice(true);
    // }

    // @audit added for testing
    // function newPendingCalculation() public {
    //     uint256 glpPrice = _getGLPPriceFromGMX();

    //     uint256 wethAmount = sbfGMX.claimable(address(this));
    //     wethAmount += fGLP.claimable(address(this));

    //     uint256 amountInGlp = (wethAmount * glpPrice) / 1e18;
    //     uint256 amount = amountInGlp - (amountInGlp * _slippage) / 10_000;

    //     // console2.log("new amount: %e", amount);
    //     // console2.log("amountInGlp: %e", amountInGlp);
    // }
}
