// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Tapioca
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";

// tests
import {StargateV2_Shared} from "../../../shared/StargateV2_Shared.t.sol";

contract StargateV2Strategy_withdraw is StargateV2_Shared {
    
    modifier whenWithdrawIsPaused() {
        strat.setPause(true, StargateV2Strategy.PauseType.Withdraw);
        _;
    }

    modifier whenWithdrawIsNotPaused() {
        strat.setPause(false, StargateV2Strategy.PauseType.Withdraw);
        _;
    }

    modifier whenTheresADepositedPosition(uint256 depositAmount) {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);
        _depositToStrategy(depositAmount);
        _;
    }

    function test_WhenWithdrawasArePaused(uint256 depositAmount, uint256 withdrawAmount) external whenWithdrawIsPaused {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);
        vm.assume(withdrawAmount < depositAmount);

        // deposit
        _depositToStrategy(depositAmount);

        // it should revert with WithdrawPaused
        vm.expectRevert(StargateV2Strategy.WithdrawPaused.selector);
        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), withdrawAmount, 0);
    }


    function test_WhenStrategyHasEnoughUnstakedBalance(uint256 depositAmount, uint256 withdrawAmount, uint256 strategyAmount) 
        external 
        whenWithdrawIsNotPaused 
    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);
        vm.assume(withdrawAmount < depositAmount);
        vm.assume(strategyAmount > withdrawAmount && strategyAmount < depositAmount);

        // deposit
        _depositToStrategy(depositAmount);

        // assure strategy has enough tokens
        _getTokenAndWrap(address(usdc), address(tUsdc), strategyAmount);
        tUsdc.transfer(address(strat), strategyAmount);

        // withdraw
        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), withdrawAmount, 0);

        // it should transfer to the receiver
        assertEq(tUsdc.balanceOf(address(this)), withdrawAmount);

        // it should not decrease farm balance
        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, depositAmount);
    }

    function test_WhenStrategyHasZeroBalance(uint256 depositAmount, uint256 withdrawAmount)
        external
        whenWithdrawIsNotPaused
        whenTheresADepositedPosition(depositAmount)
    {
        vm.assume(withdrawAmount < depositAmount);

        uint256 farmBalanceBefore = farm.balanceOf(address(strat.lpToken()), address(strat));

        // withdraw
        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), withdrawAmount, 0);

        // it should wrap & transfer to the receiver
        assertEq(tUsdc.balanceOf(address(this)), withdrawAmount);

        // it should redeem the entire amount from farm
        uint256 farmBalanceAfter = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalanceBefore - farmBalanceAfter, withdrawAmount);

        // it should leave zero allowance on inputToken for pearlmit
        uint256 inputTokenAllowance = IERC20(usdc).allowance(address(strat), address(pearlmit));
        assertEq(inputTokenAllowance, 0);
    }

    function test_WhenStrategyHasLessThanTheRequestAmount(uint256 depositAmount, uint256 withdrawAmount, uint256 strategyAmount)
        external
        whenWithdrawIsNotPaused
        whenTheresADepositedPosition(depositAmount)
    {
        vm.assume(withdrawAmount < depositAmount);
        vm.assume(strategyAmount < withdrawAmount && strategyAmount > 0);

        // assure strategy has enough tokens
        _getTokenAndWrap(address(usdc), address(tUsdc), strategyAmount);
        tUsdc.transfer(address(strat), strategyAmount);

        uint256 farmBalanceBefore = farm.balanceOf(address(strat.lpToken()), address(strat));

        vm.expectEmit(true, true, true, true);
        emit AmountWithdrawn(address(this), withdrawAmount);
        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), withdrawAmount, 0);
        
        // it should wrap & transfer to the receiver
        assertEq(tUsdc.balanceOf(address(this)), withdrawAmount);

        // it should redeem a partial amount from farm
        uint256 farmBalanceAfter = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertLt(farmBalanceBefore - farmBalanceAfter, withdrawAmount);

        // it should leave zero allowance on inputToken for pearlmit
        uint256 inputTokenAllowance = IERC20(usdc).allowance(address(strat), address(pearlmit));
        assertEq(inputTokenAllowance, 0);
    }

    function test_RevertWhen_TheresNoDeposit(uint256 withdrawAmount)
        external
        whenWithdrawIsNotPaused
    {
        vm.assume(withdrawAmount > 0 && withdrawAmount <= LOW_DECIMALS_SMALL_AMOUNT);
        // it should revert
        vm.expectRevert();
        yieldBox.withdraw(tUsdcAssetId, address(this), address(this), withdrawAmount, 0);
    }
}
