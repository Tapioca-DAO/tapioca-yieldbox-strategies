// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Tapioca
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";
import {ZeroXSwapper} from "tap-utils/Swapper/ZeroXSwapper.sol";

import {ITapiocaOracle} from "tap-utils/interfaces/periph/ITapiocaOracle.sol";
import {IZeroXSwapper} from "tap-utils/interfaces/periph/IZeroXSwapper.sol";
import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";

// mocks
import {ZeroXSwapperMockTarget} from "tapioca-strategies/mocks/ZeroXSwapperMockTarget.sol";

// tests
import {StargateV2_Shared} from "../../../shared/StargateV2_Shared.t.sol";

contract StargateV2Strategy_setters is StargateV2_Shared {
    modifier givenContractHasDeposit(uint256 depositAmount) {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);

        _approveViaERC20({token: address(tUsdc), from: address(this), operator: address(yieldBox), amount: depositAmount});

        // deposit
        _depositToStrategy(depositAmount);
        _;
    }

    modifier givenStratIsWhitelisted() {
        _resetPrank(address(this));
        cluster.updateContract(0, address(strat), true);
        _;
    }

    function test_whenRescueEthIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.rescueEth(VALUE_ZERO, ADDRESS_ZERO);
    }

    function test_whenRescueEthIsCalled_GivenAmountIsHigherThanAvailable() external {
        // it should revert with TransferFailed
        vm.expectRevert(StargateV2Strategy.TransferFailed.selector);
        strat.rescueEth(LARGE_AMOUNT, address(this));
    }

    function test_whenRescueEthIsCalled_GivenAmountIsAvailable() external {
        // add assets
        deal(address(strat), LARGE_AMOUNT);

        uint256 balanceBefore = userB.balance;
        strat.rescueEth(LARGE_AMOUNT, address(userB));

        // it should rescue requested amount
        assertEq(userB.balance - balanceBefore, LARGE_AMOUNT);
    }

    function test_whenEmergencyWithdrawIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.emergencyWithdraw();
    }

    function test_whenEmergencyWithdrawIsCalled_GivenCallerIsOwner(uint256 depositAmount) 
        external 
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)
    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_SMALL_AMOUNT);

        // deposit
        _depositToStrategy(depositAmount);

        // emergency withdraw
        strat.emergencyWithdraw();

        // it should set depositPaused on true
        assertTrue(strat.depositPaused());
        // it should set withdrawPaused on true
        assertTrue(strat.withdrawPaused());

        // it should withdraw the entire amount available on the farm
        uint256 farmBalance = farm.balanceOf(address(strat.lpToken()), address(strat));
        assertEq(farmBalance, 0);

        // it should wrap and leave it on the contract
        uint256 stratBalance = tUsdc.balanceOf(address(strat));
        assertEq(stratBalance, depositAmount);
    }

    function test_whenSetClusterIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.setCluster(ICluster(address(0x1)));
    }

    function test_whenSetClusterIsCalled_GivenClusterIsAddressZero() external {
        // it should revert with EmptyAddress
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        strat.setCluster(ICluster(ADDRESS_ZERO));
    }

    function test_whenSetClusterIsCalled_GivenClusterAddressIsValid() external {
        vm.expectEmit(false, true, false, true);
        emit ClusterUpdated(ICluster(ADDRESS_ZERO), ICluster(address(this))); 
        strat.setCluster(ICluster(address(this)));
    }


    function test_whenSetSwapperIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.setSwapper(IZeroXSwapper(address(0x1)));
    }

    function test_whenSetSwapperIsCalled_GivenSwapperIsAddressZero() external {
        // it should revert with EmptyAddress
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        strat.setSwapper(IZeroXSwapper(ADDRESS_ZERO));
    }

    function test_whenSetSwapperIsCalled_GivenSwapperAddressIsValid() external {
        // it should set the new swapper
        vm.expectEmit(true, true, true, true);
        emit SwapperUpdated(strat.swapper(), IZeroXSwapper(address(this)));
        strat.setSwapper(IZeroXSwapper(address(this)));

        // it should set the new swapper
        assertEq(address(strat.swapper()), address(this));
    }

    function test_whenSetFarmIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.setFarm(address(0x1));
    }

    function test_whenSetFarmIsCalled_GivenFarmIsAddressZero() external {
        // it should revert with EmptyAddress
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        strat.setFarm(ADDRESS_ZERO);
    }

    function test_whenSetFarmIsCalled_GivenFarmAddressIsValid() external {
        // it should set the new farm
        vm.expectEmit(true, true, true, true);
        emit FarmUpdated(address(strat.farm()), address(this));
        strat.setFarm(address(this));

        // it should set the new farm
        assertEq(address(strat.farm()), address(this));
    }


    function test_whenSetStgOracleIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.setStgOracle(ITapiocaOracle(address(0x1)), "");
    }

    function test_whenSetStgOracleIsCalled_GivenOracleIsAddressZero() external {
        // it should revert with EmptyAddress
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        strat.setStgOracle(ITapiocaOracle(ADDRESS_ZERO), "");
    }

    function test_whenSetStgOracleIsCalled_GivenOracleAddressIsValid() external {
        vm.expectEmit(true, true, true, true);
        emit StgOracleUpdated(address(strat.stgInputTokenOracle()), address(this));
        strat.setStgOracle(ITapiocaOracle(address(this)), "");

        // it should set the new stgInputTokenOracle
        assertEq(address(strat.stgInputTokenOracle()), address(this));
    }


    function test_whenSetArbOracleIsCalled_GivenCallerIsNotOwner() external resetPrank(userA) {
        // it should revert with owner error
        vm.expectRevert("Ownable: caller is not the owner");
        strat.setArbOracle(ITapiocaOracle(address(0x1)), "");
    }

    function test_whenSetArbOracleIsCalled_WhenOracleIsAddressZero() external {
        // it should revert with EmptyAddress
        vm.expectRevert(StargateV2Strategy.EmptyAddress.selector);
        strat.setArbOracle(ITapiocaOracle(ADDRESS_ZERO), "");
    }

    function test_whenSetArbOracleIsCalled_WhenOracleAddressIsValid() external {
        vm.expectEmit(true, true, true, true);
        emit ArbOracleUpdated(address(strat.arbInputTokenOracle()), address(this));
        strat.setArbOracle(ITapiocaOracle(address(this)), "");

        // it should set the new arbInputTokenOracle
        assertEq(address(strat.arbInputTokenOracle()), address(this));
    }


    function test_whenInvestIsCalled_GivenContractHasNoRewards(uint256 depositAmount) 
        external 
        givenContractHasDeposit(depositAmount)
    {
        // deposit
        _depositToStrategy(depositAmount);

        uint256 farmBalanceBefore = farm.balanceOf(address(strat.lpToken()), address(strat));

        // invest
        strat.invest("", "");

        uint256 farmBalanceAfter = farm.balanceOf(address(strat.lpToken()), address(strat));

        // shouldn't change
        assertEq(farmBalanceBefore, farmBalanceAfter);
    }

    modifier whenContractHasARBAndSTGRewards() {
        // deal ARB
        _getToken(strat.ARB(), SMALL_AMOUNT, address(strat));
        _getToken(address(usdc), LOW_DECIMALS_SMALL_AMOUNT, address(swapperTarget));


        // deal STG
        _getToken(strat.STG(), SMALL_AMOUNT, address(strat));
        _getToken(address(usdc), LOW_DECIMALS_SMALL_AMOUNT, address(swapperTarget));
        _;
    }

    function test_whenInvestIsCalled_GivenSwapAmountIsLessThanMinAmountOut(uint256 depositAmount)
        external
        givenContractHasDeposit(depositAmount)
        whenContractHasARBAndSTGRewards
        givenStratIsWhitelisted
        resetPrank(address(this))
    {
        //arb swap data
        IZeroXSwapper.SZeroXSwapData memory arbZeroXSwapData = IZeroXSwapper.SZeroXSwapData({
            sellToken: IERC20(strat.ARB()),
            buyToken: IERC20(address(usdc)),
            swapTarget: payable(swapperTarget),
            swapCallData: abi.encodeWithSelector(
                ZeroXSwapperMockTarget.transferTokens.selector, address(usdc), LOW_DECIMALS_SMALL_AMOUNT - 1 
            )
        });
        StargateV2Strategy.SSwapData memory arbSwapData =
            StargateV2Strategy.SSwapData({minAmountOut: LARGE_AMOUNT, data: arbZeroXSwapData});

        //stg swap data
        IZeroXSwapper.SZeroXSwapData memory stgZeroXSwapData = IZeroXSwapper.SZeroXSwapData({
            sellToken: IERC20(strat.STG()),
            buyToken: IERC20(address(usdc)),
            swapTarget: payable(swapperTarget),
            swapCallData: abi.encodeWithSelector(
                ZeroXSwapperMockTarget.transferTokens.selector, address(usdc), LOW_DECIMALS_SMALL_AMOUNT - 1
            )
        });
        StargateV2Strategy.SSwapData memory stgSwapData =
            StargateV2Strategy.SSwapData({minAmountOut: LOW_DECIMALS_SMALL_AMOUNT, data: stgZeroXSwapData});

        // expect MinSwapFailed error
        vm.expectRevert();
        strat.invest(abi.encode(arbSwapData), abi.encode(stgSwapData));
    }

    function test_whenInvestIsCalled_GivenSwapAmountIsValid(uint256 depositAmount)
        external
        givenContractHasDeposit(depositAmount)
        whenContractHasARBAndSTGRewards
        givenStratIsWhitelisted
        resetPrank(address(this))
    {
        //arb swap data
        IZeroXSwapper.SZeroXSwapData memory arbZeroXSwapData = IZeroXSwapper.SZeroXSwapData({
            sellToken: IERC20(strat.ARB()),
            buyToken: IERC20(address(usdc)),
            swapTarget: payable(swapperTarget),
            swapCallData: abi.encodeWithSelector(
                ZeroXSwapperMockTarget.transferTokens.selector, address(usdc), LOW_DECIMALS_SMALL_AMOUNT 
            )
        });
        StargateV2Strategy.SSwapData memory arbSwapData =
            StargateV2Strategy.SSwapData({minAmountOut: LOW_DECIMALS_SMALL_AMOUNT, data: arbZeroXSwapData});

        //stg swap data
        IZeroXSwapper.SZeroXSwapData memory stgZeroXSwapData = IZeroXSwapper.SZeroXSwapData({
            sellToken: IERC20(strat.STG()),
            buyToken: IERC20(address(usdc)),
            swapTarget: payable(swapperTarget),
            swapCallData: abi.encodeWithSelector(
                ZeroXSwapperMockTarget.transferTokens.selector, address(usdc), LOW_DECIMALS_SMALL_AMOUNT
            )
        });
        StargateV2Strategy.SSwapData memory stgSwapData =
            StargateV2Strategy.SSwapData({minAmountOut: LOW_DECIMALS_SMALL_AMOUNT, data: stgZeroXSwapData});

        // invest
        uint256 farmBalanceBefore = farm.balanceOf(address(strat.lpToken()), address(strat));

        vm.expectEmit();
        emit AmountDeposited(LOW_DECIMALS_SMALL_AMOUNT);
        strat.invest(abi.encode(arbSwapData), abi.encode(stgSwapData));
        uint256 farmBalanceAfter = farm.balanceOf(address(strat.lpToken()), address(strat));

        // it should increase farm balance
        assertGt(farmBalanceAfter, farmBalanceBefore);
    }
}
