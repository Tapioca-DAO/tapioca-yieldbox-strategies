// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Tapioca
import {StargateV2Strategy} from "tapioca-strategies/StargateV2Strategy/StargateV2Strategy.sol";

// tests
import {StargateV2RewarderMock} from "tapioca-strategies/mocks/StargateV2RewarderMock.sol";
import {StargateV2_Shared} from "../../../shared/StargateV2_Shared.t.sol";

contract StargateV2Strategy_view is StargateV2_Shared {
    StargateV2RewarderMock rewarderMock;

    function setUp() public virtual override {
        super.setUp();
        rewarderMock = new StargateV2RewarderMock();

        arbOracle.set(ARB_USDC_RATE);
        stgOracle.set(STG_USDC_RATE);
    }

    modifier whenMockRewarder() {
        address farmOwner = farm.owner();
        _resetPrank(farmOwner);
        farm.setPool(pool.lpToken(), address(rewarderMock));
        _;
    }

    function test_WhenNameIsCalled() external view {
        // it should return value which length is not zero
        string memory name = strat.name();
        assertGt(bytes(name).length, 0);
    }

    function test_WhenDescriptionIsCalled() external view {
        // it should return value which length is not zero
        string memory description = strat.description();
        assertGt(bytes(description).length, 0);
    }

    function test_WhenOracleReturnsAValidRate(uint256 depositAmount) 
        external
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)

    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_LARGE_AMOUNT);

        // deposit for rewards accrual
        _depositToStrategy(depositAmount);

        // advance time to check pending rewards
        vm.warp(FUTURE_TIMESTAMP);

        assertGt(strat.pendingRewards(), 0);

    }

    function test_WhenOracleReturnsAnInvalidRateAndDoesNotRevert(uint256 depositAmount)
        external
        whenApprovedViaERC20(address(tUsdc), address(this), address(yieldBox),  depositAmount)
    {
        vm.assume(depositAmount > 0 && depositAmount <= LOW_DECIMALS_LARGE_AMOUNT);

        // deposit for rewards accrual
        _depositToStrategy(depositAmount);
        
        // set invalid oracle rates
        arbOracle.set(0);
        stgOracle.set(0);

        // advance time to check pending rewards
        vm.warp(2951684352);

        // it should return 0
        assertEq(strat.pendingRewards(), 0);
    }

  
    function test_RevertWhen_ReceivedRewardsAreNotAccepted()
        external
        whenMockRewarder
    {
        // create rewards array
        address[] memory _tokens = new address[](2);
        _tokens[0] = address(0x1);
        _tokens[1] = address(0x2);
        uint256[] memory _amounts = new uint256[](2);
        rewarderMock.setRewards(_tokens, _amounts);

        // it should revert
        vm.expectRevert(StargateV2Strategy.TokenNotValid.selector);
        strat.pendingRewards();
    }

    function test_WhenReceivedRewardsAreAvailableButWithZeroValue()
        external
        whenMockRewarder
    {
        // create rewards array
        address[] memory _tokens = new address[](2);
        _tokens[0] = strat.STG();
        _tokens[1] = strat.ARB();
        uint256[] memory _amounts = new uint256[](2);
        _amounts[0] = 0;
        _amounts[1] = 0;
        rewarderMock.setRewards(_tokens, _amounts);

        // it should return 0
        assertEq(strat.pendingRewards(), 0);
    }
}
