// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Tapioca
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";

// tests
import {StargateV2_Shared} from "../../../shared/StargateV2_Shared.t.sol";

contract StargateV2Strategy_deposit is StargateV2_Shared {
    modifier whenDepositsArePaused() {
        strat.setPause(true, StargateV2Strategy.PauseType.Deposit);
        _;
    }

    modifier whenDepositsAreNotPaused() {
        strat.setPause(false, StargateV2Strategy.PauseType.Deposit);
        _;
    }

    function test_WhenDepositsArePaused(uint256 depositAmount) 
        external 
        whenDepositsArePaused
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)
    {   
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);

        _getTokenAndWrap(address(usdc), address(tUsdc), depositAmount);
        _resetPrank(address(this));

        // it should revert with DepositPaused
        vm.expectRevert(StargateV2Strategy.DepositPaused.selector);
        yieldBox.depositAsset(tUsdcAssetId, address(this), address(this), depositAmount, 0);
    }

    function test_RevertWhen_StrategyDoesNotReceiveTheRequestedAmount(uint256 depositAmount) 
        external 
        whenDepositsAreNotPaused
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  type(uint256).max) 
    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);
        // it should revert
        vm.expectRevert("BoringERC20: TransferFrom failed");
        yieldBox.depositAsset(tUsdcAssetId, address(this), address(this), depositAmount, 0);
    }

    function test_WhenStrategyHasReceivedTheProperAmount(uint256 depositAmount) 
        external 
        whenDepositsAreNotPaused 
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)
    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);

        _depositToStrategy(depositAmount);

        // it should unwrap and increase farm deposit
        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, depositAmount);

        // it should increase currentBalance
        uint256 currentBalance = strat.currentBalance();
        assertEq(currentBalance, depositAmount);

        // it should leave zero approval on inputToken for pool
        uint256 inputTokenAllowance = IERC20(usdc).allowance(address(strat), address(pool));
        assertEq(inputTokenAllowance, 0);

        // it should leave zero approval on lpToken for farm
        uint256 lpTokenAllowance = IERC20(pool.lpToken()).allowance(address(strat), address(farm));
        assertEq(lpTokenAllowance, 0);
    }
}
