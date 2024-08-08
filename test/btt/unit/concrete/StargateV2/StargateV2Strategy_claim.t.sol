// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Tapioca
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";

// tests
import {StargateV2_Shared} from "../../../shared/StargateV2_Shared.t.sol";

contract StargateV2Strategy_claim is StargateV2_Shared {
    function test_WhenArrayIsEmpty() external {
        address[] memory _tokens;
        vm.assume(_tokens.length == 0);
        vm.expectRevert();
        strat.claim(_tokens);
    }

    function test_WhenArrayLengthMoreThanOne() external {
        address[] memory _tokens = new address[](2);
        _tokens[0] = address(0x1);
        _tokens[1] = address(0x2);
        // it should revert with TokenNotValid
        vm.expectRevert(StargateV2Strategy.TokenNotValid.selector);
        strat.claim(_tokens);
    }

    function test_WhenItemAtIndexZeroIsNotLpToken() external {
        address[] memory _tokens = new address[](1);
        _tokens[0] = address(0x1);
        // it should revert with TokenNotValid
        vm.expectRevert(StargateV2Strategy.TokenNotValid.selector);
        strat.claim(_tokens);
    }

    function test_WhenItemAtIntexZeroIsLpToken(uint256 depositAmount) 
        external 
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)
    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);

        // deposit
        _depositToStrategy(depositAmount);

        // advance time to accrue rewards
        vm.warp(FUTURE_TIMESTAMP);

        // it should call claim
        address[] memory _tokens = new address[](1);
        _tokens[0] = pool.lpToken();
        strat.claim(_tokens);

        // assert rewards received
        uint256 arbBalance = IERC20(strat.ARB()).balanceOf(address(strat));
        uint256 stgBalance = IERC20(strat.STG()).balanceOf(address(strat));
        assertTrue(arbBalance > 0 || stgBalance > 0);
    }
}
