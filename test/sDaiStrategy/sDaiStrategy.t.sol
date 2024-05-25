// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldBox, YieldBox, YieldBoxURIBuilder, IWrappedNative, TokenType, IStrategy} from "tap-yieldbox/YieldBox.sol";
import {IYieldBox} from "tap-yieldbox/interfaces/IYieldBox.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";
import {ISavingsDai} from "tapioca-periph/interfaces/external/makerdao/ISavingsDai.sol";
import {sDaiStrategy} from "contracts/sdai/sDaiStrategy.sol";

import "forge-std/Test.sol";

contract SDaiStrategyTest is Test {
    /**
     * ENV KEY
     */
    string constant ENV_BINANCE_WALLET_ADDRESS = "BINANCE_WALLET_ADDRESS";
    string constant ENV_DAI_ADDRESS = "DAI_ADDRESS";
    string constant ENV_SAVINGS_DAI_ADDRESS = "SDAI";
    string constant ENV_WETH_ADDRESS = "WETH_ADDRESS";
    string constant RPC_URL = "RPC_URL";
    string constant FORKING_BLOCK_NUMBER = "FORKING_BLOCK_NUMBER";
    uint256 MAINNET_FORK;

    /**
     * Contract loading
     */
    YieldBox yieldBox;
    ISavingsDai sDai;
    sDaiStrategy sDaiStrat;
    IERC20 dai;
    ToftMock tDai;

    /**
     * Vars
     */
    address public binanceWalletAddr;
    address owner;
    uint256 sDaiStratAssetId;

    /**
     * Modifiers
     */

    modifier isMainnetFork() {
        vm.selectFork(MAINNET_FORK);
        _;
    }

    modifier prankBinance() {
        vm.startPrank(binanceWalletAddr);
        _;
    }

    modifier setupAndprankBinance(uint256 _amountToTransfer) {
        _transferDaiToAddress(_amountToTransfer, binanceWalletAddr);

        vm.startPrank(binanceWalletAddr);
        _;
    }

    modifier prankYieldBox() {
        vm.startPrank(address(yieldBox));
        _;
    }

    modifier setDepositThreshold(uint256 thresholdAmount) {
        sDaiStrat.setDepositThreshold(thresholdAmount);
        _;
    }

    /**
     * Setup
     */
    function setUp() public {
        string memory rpcUrl = vm.envString(RPC_URL);
        // uint256 forkingBlockNumber = vm.envUint(FORKING_MAINNET_BLOCK_NUMBER);
        // MAINNET_FORK = vm.createSelectFork(rpcUrl, forkingBlockNumber);
        // @audit env FORKING_MAINNET_BLOCK_NUMBER variable not being recognized so using this for now
        MAINNET_FORK = vm.createSelectFork(rpcUrl, 19921402);

        // Load env
        binanceWalletAddr = vm.envAddress(ENV_BINANCE_WALLET_ADDRESS);
        vm.label(binanceWalletAddr, "binanceWalletAddr");
        address daiAddress = vm.envAddress(ENV_DAI_ADDRESS);
        vm.label(daiAddress, "daiAddress");
        address sDaiAddress = vm.envAddress(ENV_SAVINGS_DAI_ADDRESS);
        vm.label(sDaiAddress, "sDaiAddress");
        address wethAddress = vm.envAddress(ENV_WETH_ADDRESS);
        vm.label(wethAddress, "wethAddress");

        // get DAI contracts
        dai = IERC20(daiAddress);
        sDai = ISavingsDai(sDaiAddress);

        // deploy contracts
        tDai = new ToftMock(address(dai), "Toft", "TOFT");
        vm.label(address(tDai), "tDai");
        yieldBox = new YieldBox(
            IWrappedNative(wethAddress),
            new YieldBoxURIBuilder()
        );
        vm.label(address(yieldBox), "yieldBox");

        // deploy strategy
        sDaiStrat = new sDaiStrategy(
            IYieldBox(address(yieldBox)),
            address(tDai),
            sDai,
            address(this)
        );
        vm.label(address(sDaiStrat), "sDaiStrat");

        // register the asset in YieldBox
        yieldBox.registerAsset(
            TokenType.ERC20,
            address(tDai),
            IStrategy(address(sDaiStrat)),
            0
        );

        // set assetId from value in YieldBox
        sDaiStratAssetId = yieldBox.ids(
            TokenType.ERC20,
            address(tDai),
            IStrategy(address(sDaiStrat)),
            0
        );
    }

    /**
        Deposits
    **/
    // 1. tDAI passed in on deposit is deposited for sDaiStrategy
    function test_deposit_accounted_for()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        _approveAllContracts();

        uint256 initialDaiBalanceOfUser = dai.balanceOf(binanceWalletAddr);

        // wraps DAI -> tDAI
        _wrapDai(binanceWalletAddr, initialDaiBalanceOfUser);

        uint256 tDaiBalanceOfUser = tDai.balanceOf(binanceWalletAddr);
        uint256 sDaiBalanceEquivalentOfUser = sDai.previewDeposit(
            tDaiBalanceOfUser
        );

        // deposit into strategy
        _depositIntoStrategy(binanceWalletAddr, tDaiBalanceOfUser);

        assertTrue(
            sDaiBalanceEquivalentOfUser == sDai.balanceOf(address(sDaiStrat)),
            "sDaiStrat doesn't receive sDAI from deposit"
        );
    }

    // 3a. only YieldBox can deposit into strategy
    function test_non_yieldBox_cant_deposit()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        _approveAllContracts();

        uint256 userStartingDaiBalance = dai.balanceOf(binanceWalletAddr);

        _wrapDai(binanceWalletAddr, userStartingDaiBalance);

        vm.expectRevert("Not YieldBox");
        sDaiStrat.deposited(userStartingDaiBalance);
    }

    // 4. depositing sDAI directly to strategy should fail
    function test_deposit_directly_to_strategy()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 userStartingDaiBalance = dai.balanceOf(binanceWalletAddr);

        _approveAllContracts();

        // send sDai directly to strategy
        dai.approve(address(sDai), userStartingDaiBalance);
        sDai.deposit(userStartingDaiBalance, address(sDaiStrat));

        // try calling the deposit function on strategy
        vm.expectRevert("BoringERC20: TransferFrom failed");
        _depositIntoStrategy(binanceWalletAddr, userStartingDaiBalance);
    }

    function test_cant_deposit_when_paused() public isMainnetFork {
        // user gets dealt initial DAI amount
        _transferDaiToAddress(10_000, binanceWalletAddr);

        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // admin pauses strategy
        sDaiStrat.updatePaused(true);

        // user tries to deposit when paused, tx reverts
        vm.startPrank(binanceWalletAddr);
        _approveAllContracts();

        _wrapDai(binanceWalletAddr, initialUserBalance);

        vm.expectRevert(sDaiStrategy.Paused.selector);
        _depositIntoStrategy(binanceWalletAddr, initialUserBalance);
        vm.stopPrank();
    }

    // 11. Tokens are added to deposit queue if threshold isn't met when depositing
    function test_tokens_added_to_queue()
        public
        isMainnetFork
        setDepositThreshold(20_000)
        setupAndprankBinance(10_000)
    {
        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user makes a deposit below threshold
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);

        // check that deposit remains in queue
        uint256 strategyBalance = tDai.balanceOf(address(sDaiStrat));
        assertTrue(
            strategyBalance == initialUserBalance,
            "user deposit doesn't get added to queue"
        );
    }

    // 12. Deposit queue gets fully deposited, no dust remains
    function test_queue_fully_deposited()
        public
        isMainnetFork
        setDepositThreshold(10_000)
        setupAndprankBinance(10_000)
    {
        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user makes a deposit below threshold
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);

        uint256 strategyBalance = tDai.balanceOf(address(sDaiStrat));
        assertTrue(
            strategyBalance == 0,
            "strategy not empty after clearing queue"
        );
    }

    /**
        Withdrawals
    **/

    // @audit see finding Med - 1
    // 2. user can always withdraw as much as they deposited (with no savings accumulated)
    // 5. withdrawing with 0 savings accumulated doesn't revert
    // 7. sDaiStrategy balance of sDAI decreases on withdrawal
    function test_no_withdrawal_loss_when_no_savings_accumulated()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 initialUserDaiBalance = dai.balanceOf(binanceWalletAddr);

        //approve, wrap and deposit into strategy
        _approveWrapAndDeposit(binanceWalletAddr, initialUserDaiBalance);

        uint256 strategySDaiBalanceAfterDeposit = sDai.balanceOf(
            address(sDaiStrat)
        );

        uint256 maxWithdraw = sDai.maxWithdraw(address(sDaiStrat));

        // withdraw from strategy
        _withdrawFromStrategy(binanceWalletAddr, maxWithdraw);

        uint256 strategySDaiBalanceAfterWithdraw = sDai.balanceOf(
            address(sDaiStrat)
        );

        // unwrap user's tDai -> dai
        _unwrapDai(
            binanceWalletAddr,
            tDai.balanceOf(address(binanceWalletAddr))
        );

        uint256 userDaiBalanceAfterWithdraw = dai.balanceOf(
            address(binanceWalletAddr)
        );

        assertTrue(
            strategySDaiBalanceAfterWithdraw == 0,
            "strategy not empty after max withdraw"
        );
        assertTrue(
            initialUserDaiBalance == userDaiBalanceAfterWithdraw,
            "user loses value after depositing"
        );
    }

    // 3b. only YieldBox can withdraw from strategy
    function test_non_yieldBox_cant_withdraw()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 userStartingDaiBalance = dai.balanceOf(binanceWalletAddr);

        _approveWrapAndDeposit(binanceWalletAddr, userStartingDaiBalance);

        vm.expectRevert("Not YieldBox");
        sDaiStrat.withdraw(binanceWalletAddr, userStartingDaiBalance);
    }

    // @audit fails for same reason as dust issue described in Med - 1
    // 6a. user balance of tDAI increases by amount on call to withdraw when no savings accumulated
    function test_tDai_balance_increases_on_withdraw()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 userStartingDaiBalance = dai.balanceOf(binanceWalletAddr);
        console2.log("userStartingDaiBalance: ", userStartingDaiBalance);

        _approveWrapAndDeposit(binanceWalletAddr, userStartingDaiBalance);

        uint256 maxWithdraw = sDai.maxWithdraw(address(sDaiStrat));

        _withdrawFromStrategy(binanceWalletAddr, maxWithdraw);

        uint256 userTDaiBalanceAfterWithdraw = tDai.balanceOf(
            binanceWalletAddr
        );
        console2.log(
            "userTDaiBalanceAfterWithdraw: ",
            userTDaiBalanceAfterWithdraw
        );
        // wrapped tDai is 1:1 with dai so using the starting dai balance here
        assertTrue(
            userStartingDaiBalance == userTDaiBalanceAfterWithdraw,
            "user loses tDai"
        );
    }

    // @audit fails for same reason as dust issue described in Med - 1
    // 6b. user balance of tDAI increases by amount on call to withdraw when savings accumulated
    function test_tDai_balance_increases_on_withdraw_savings_accumulated()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 userStartingDaiBalance = dai.balanceOf(binanceWalletAddr);
        console2.log("userStartingDaiBalance: ", userStartingDaiBalance);

        _approveWrapAndDeposit(binanceWalletAddr, userStartingDaiBalance);

        uint256 maxWithdraw = sDai.maxWithdraw(address(sDaiStrat));

        // warp ahead for savings to have accumulated
        vm.warp(block.timestamp + 5 days);
        _withdrawFromStrategy(binanceWalletAddr, maxWithdraw);

        uint256 userTDaiBalanceAfterWithdraw = tDai.balanceOf(
            binanceWalletAddr
        );
        console2.log(
            "userTDaiBalanceAfterWithdraw: ",
            userTDaiBalanceAfterWithdraw
        );
        // wrapped tDai is 1:1 with dai so using the starting dai balance here
        assertTrue(
            userStartingDaiBalance == userTDaiBalanceAfterWithdraw,
            "user loses tDai"
        );
    }

    // @audit related to issue Med - 1
    // 8. User can always withdraw up to the full amount of sDAI in the GlpStrategy
    function test_user_can_always_fully_withdraw()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 userStartingDaiBalance = dai.balanceOf(binanceWalletAddr);

        _approveWrapAndDeposit(binanceWalletAddr, userStartingDaiBalance);

        uint256 maxWithdrawBefore = sDai.maxWithdraw(address(sDaiStrat));

        // warp ahead for savings to have accumulated
        vm.warp(block.timestamp + 5 days);

        uint256 maxWithdrawAfter = sDai.maxWithdraw(address(sDaiStrat));

        assertTrue(
            maxWithdrawAfter - maxWithdrawBefore != 0,
            "savings haven't accumulated"
        );

        _withdrawFromStrategy(binanceWalletAddr, maxWithdrawAfter - 1);

        assertTrue(
            sDai.balanceOf(address(sDaiStrat)) == 0,
            "strategy not empty after withdraw"
        );
    }

    // 9. User can only withdraw share + yield accumulated for their shares
    function test_user_can_only_withdraw_their_amount() public isMainnetFork {
        address alice = address(0x1);
        address bob = address(0x2);

        // load accounts with dai
        uint256 initialStartingBalance = 10_000;
        _transferDaiToAddress(initialStartingBalance, alice);
        _transferDaiToAddress(initialStartingBalance, bob);

        // Alice deposits
        vm.startPrank(alice);
        _approveWrapAndDeposit(alice, initialStartingBalance);
        vm.stopPrank();

        // Bob deposits
        vm.startPrank(bob);
        _approveWrapAndDeposit(bob, initialStartingBalance);
        vm.stopPrank();

        // Alice tries to withdraw her deposit + Bob's
        vm.startPrank(alice);
        vm.expectRevert(stdError.arithmeticError);
        _withdrawFromStrategy(alice, initialStartingBalance * 2);
        vm.stopPrank();
    }

    function test_cant_withdraw_when_paused() public isMainnetFork {
        // user gets dealt initial DAI amount
        _transferDaiToAddress(10_000, binanceWalletAddr);

        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user deposits
        vm.startPrank(binanceWalletAddr);
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);
        vm.stopPrank();

        // admin pauses strategy
        sDaiStrat.updatePaused(true);

        vm.startPrank(binanceWalletAddr);
        // user tries to wihtdraw when paused, tx reverts
        vm.expectRevert(sDaiStrategy.Paused.selector);
        _withdrawFromStrategy(binanceWalletAddr, initialUserBalance - 1);
        vm.stopPrank();
    }

    // @audit see finding Informational - 6
    function test_revert_when_strategy_balance_insufficient()
        public
        isMainnetFork
    {
        // user gets dealt initial DAI amount
        _transferDaiToAddress(10_000, binanceWalletAddr);

        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user deposits
        vm.startPrank(binanceWalletAddr);
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);
        vm.stopPrank();

        // simulate an event that causes contract to leak value
        vm.startPrank(address(sDaiStrat));
        // burn majority of user balance by sending it to a random address
        sDai.transfer(address(0x1), sDai.balanceOf(address(sDaiStrat)) - 50);
        vm.stopPrank();

        vm.startPrank(binanceWalletAddr);
        // user tries to withdraw their initial amount - dust, should revert in the call to sDaiStrategy::_withdraw
        vm.expectRevert(sDaiStrategy.NotEnough.selector);
        _withdrawFromStrategy(binanceWalletAddr, 55);
        vm.stopPrank();
    }

    // 10a. user withdrawing their share doesn't affect other's ability to withdraw when no savings accumulated
    function test_user_balances_disjoint_no_accumulation()
        public
        isMainnetFork
    {
        address alice = address(0x1);
        address bob = address(0x2);

        // load accounts with dai
        uint256 initialStartingBalance = 10_000;
        _transferWrapAndDepositMultiple(initialStartingBalance, alice, bob);

        // Alice withdraws her deposit
        vm.startPrank(alice);
        _withdrawFromStrategy(alice, initialStartingBalance - 1);
        vm.stopPrank();

        // Bob withdraws his deposit
        vm.startPrank(bob);
        _withdrawFromStrategy(bob, initialStartingBalance - 1);
        vm.stopPrank();
    }

    // 10b. user withdrawing their share doesn't affect other's ability to withdraw when savings accumulated
    function test_user_balances_disjoint_with_accumulation()
        public
        isMainnetFork
    {
        address alice = address(0x1);
        address bob = address(0x2);

        // load accounts with dai
        uint256 initialStartingBalance = 10_000;
        _transferWrapAndDepositMultiple(initialStartingBalance, alice, bob);

        // savings accumulate over a given amount of time
        vm.warp(block.timestamp + 5 days);

        // NOTE: on withdrawal using initialStartingBalance - 1 because of dust amount issue
        // Alice withdraws her deposit
        vm.startPrank(alice);
        _withdrawFromStrategy(alice, initialStartingBalance - 1);
        vm.stopPrank();

        // Bob withdraws his deposit
        vm.startPrank(bob);
        _withdrawFromStrategy(bob, initialStartingBalance - 1);
        vm.stopPrank();
    }

    // 13. User can withdraw if their assets remain in queue
    function test_withdraw_assets_in_queue()
        public
        isMainnetFork
        setDepositThreshold(20_000)
        setupAndprankBinance(10_000)
    {
        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user makes a deposit below threshold
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);

        // user withdraws their deposit before it gets deposited in sDAI
        _withdrawFromStrategy(binanceWalletAddr, initialUserBalance);

        // unwrap tDai for equal comparison of DAI balances
        tDai.unwrap(binanceWalletAddr, tDai.balanceOf(binanceWalletAddr));
        uint256 userBalanceAfterWithdraw = dai.balanceOf(binanceWalletAddr);

        assertTrue(
            initialUserBalance == userBalanceAfterWithdraw,
            "user can't withdraw queued balance"
        );
    }

    /** 
     Savings Accumulation
    **/
    function test_harvestable_no_accumulation()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user makes a deposit
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);

        uint256 harvestableBeforeWithdraw = sDaiStrat.harvestable();

        // user withdraws their deposit before any accumulation happens
        _withdrawFromStrategy(binanceWalletAddr, initialUserBalance - 1);

        assertTrue(
            harvestableBeforeWithdraw == 0,
            "savings accumulated on deposited amount"
        );
    }

    // @audit see issue Med - 2
    function test_harvestable_with_accumulation()
        public
        isMainnetFork
        setupAndprankBinance(10_000)
    {
        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user makes a deposit
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);

        vm.warp(block.timestamp + 5 days);
        uint256 harvestableBeforeWithdraw = sDaiStrat.harvestable();
        console2.log("harvestableBeforeWithdraw: ", harvestableBeforeWithdraw);

        uint256 maxWithdrawAfter = sDai.maxWithdraw(address(sDaiStrat));
        console2.log("maxWithdrawAfter: ", maxWithdrawAfter);
        console2.log("sDai addr in test: ", address(sDai));

        // user withdraws their deposit after savings accumulate
        _withdrawFromStrategy(binanceWalletAddr, initialUserBalance - 1);

        assertTrue(
            harvestableBeforeWithdraw == maxWithdrawAfter,
            "maxWithdrawAmounts differ after accumulating"
        );
        assertTrue(
            harvestableBeforeWithdraw > 0,
            "savings accumulated on deposited amount"
        );
    }

    /**
        Simple tests to achieve coverage
    **/

    function test_name() public isMainnetFork {
        assertTrue(
            keccak256(abi.encodePacked(sDaiStrat.name())) ==
                keccak256(abi.encodePacked("sDai"))
        );
    }

    function test_description() public isMainnetFork {
        assertTrue(
            keccak256(abi.encodePacked(sDaiStrat.description())) ==
                keccak256(abi.encodePacked("sDai strategy for tDai assets"))
        );
    }

    /** 
        Admin Functions
    **/

    function test_updatePaused() public isMainnetFork {
        sDaiStrat.updatePaused(true);
    }

    function test_rescueETH() public isMainnetFork {
        uint256 ethSent = 5 ether;
        address alice = address(0x1);
        vm.deal(alice, ethSent);

        // alice sends ETH to the strategy
        vm.prank(alice);
        (bool success, ) = address(sDaiStrat).call{value: ethSent}("");
        require(success, "Transfer failed");

        // admin rescues ETH from strategy
        sDaiStrat.rescueEth(ethSent, alice);

        assertTrue(
            alice.balance == ethSent,
            "alice doesn't receive all ETH sent"
        );
        assertTrue(address(sDaiStrat).balance == 0, "ETH remains in strategy");
    }

    function test_emergencyWithdraw() public isMainnetFork {
        _transferDaiToAddress(10_000, binanceWalletAddr);

        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // binance user deposits into strategy
        vm.startPrank(binanceWalletAddr);
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);
        vm.stopPrank();

        // admin emergency withdraws from sDai
        sDaiStrat.emergencyWithdraw();
        uint256 tDaiBalanceOfStrat = tDai.balanceOf(address(sDaiStrat));

        // @audit user loses dust amount due to rounding when subtracting from sDai, this is accounted for in the - 1 in the assertion
        // all of user's deposits should be held in sDaiStrategy
        assertTrue(
            tDaiBalanceOfStrat == initialUserBalance - 1,
            "user loses funds on emergency withdraw"
        );
    }

    function test_user_withdraw_after_emergencyWithdraw_unpause()
        public
        isMainnetFork
    {
        _transferDaiToAddress(10_000, binanceWalletAddr);

        uint256 initialUserBalance = dai.balanceOf(binanceWalletAddr);

        // user deposits into strategy
        vm.startPrank(binanceWalletAddr);
        _approveWrapAndDeposit(binanceWalletAddr, initialUserBalance);
        vm.stopPrank();

        // admin emergency withdraws from sDai
        sDaiStrat.emergencyWithdraw();
        uint256 tDaiBalanceOfStrat = tDai.balanceOf(address(sDaiStrat));

        // admin unpauses strategy
        sDaiStrat.updatePaused(false);

        uint256 balanceAccountingForDust = initialUserBalance - 1;
        // user withdraws from strategy
        vm.startPrank(binanceWalletAddr);
        _withdrawFromStrategy(binanceWalletAddr, balanceAccountingForDust);
        tDai.unwrap(binanceWalletAddr, balanceAccountingForDust);
        vm.stopPrank();

        uint256 userBalanceAfterWithdraw = dai.balanceOf(binanceWalletAddr);

        // user should receive their original balance back, less the dust amount they lose to rounding
        assertTrue(
            userBalanceAfterWithdraw == initialUserBalance - 1,
            "user loses DAI on emergency withdraw"
        );
    }

    /**
        Utils
    **/
    function _transferDaiToAddress(uint256 amount, address recipient) internal {
        address whale = 0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf;
        address to = address(recipient);
        uint256 whaleBalance = dai.balanceOf(whale);

        vm.prank(whale);
        dai.transfer(to, amount);
    }

    function _approveAllContracts() internal {
        // max approve all contracts interacted with in depositing flow
        dai.approve(address(tDai), type(uint256).max);
        tDai.approve(address(yieldBox), type(uint256).max);
    }

    function _wrapDai(address addressToWrapFor, uint256 amount) internal {
        tDai.wrap(addressToWrapFor, addressToWrapFor, amount);
    }

    function _unwrapDai(address addressToUnwrapFor, uint256 amount) internal {
        tDai.unwrap(addressToUnwrapFor, amount);
    }

    function _depositIntoStrategy(address depositor, uint256 amount) internal {
        yieldBox.depositAsset(
            sDaiStratAssetId,
            depositor,
            depositor,
            amount,
            0
        );
    }

    function _withdrawFromStrategy(
        address withdrawer,
        uint256 amount
    ) internal {
        yieldBox.withdraw(sDaiStratAssetId, withdrawer, withdrawer, amount, 0);
    }

    function _approveWrapAndDeposit(
        address depositor,
        uint256 amount
    ) internal {
        _approveAllContracts();
        _wrapDai(depositor, amount);
        _depositIntoStrategy(depositor, amount);
    }

    function _transferWrapAndDepositMultiple(
        uint256 amount,
        address depositor1,
        address depositor2
    ) internal {
        _transferDaiToAddress(amount, depositor1);
        _transferDaiToAddress(amount, depositor2);

        // first user deposits
        vm.startPrank(depositor1);
        _approveWrapAndDeposit(depositor1, amount);
        vm.stopPrank();

        // second user deposits
        vm.startPrank(depositor2);
        _approveWrapAndDeposit(depositor2, amount);
        vm.stopPrank();
    }
}
