## Specifications tested in sDaiStrategy

1. tDAI passed in on deposit is deposited for sDaiStrategy [x]
2. user can always withdraw as much as they deposited [x] 
3. only YieldBox can withdraw and deposit into strategy [x]
4. depositing sDAI directly to strategy should not result in user getting shares [x]
5. withdrawing with 0 savings accumulated doesn't revert [x]
6. user balance of tDAI increases by amount on call to withdraw [x]
7. sDaiStrategy balance of sDAI decreases on withdrawal [x]
8. User can always withdraw up to the full amount of sDAI in the GlpStrategy [x]
9. User can only withdraw share + yield accumulated for their shares [x]
10. User withdrawing their share doesn't affect other's ability to withdraw [x]
11. Tokens are added to deposit queue if threshold isn't met when depositing [x]
12. Deposit queue gets fully deposited, no dust remains [x]
13. User can withdraw if their assets remain in queue [x]

NOTE: any tests that make assertions with initialUserBalance - 1 are taking into account dust issue 1 outlined below. 

## Coverage 

- possible branches: 
    - `rescueEth`
        1. fails
        2. succeeds
    - `_deposited`
        3. paused
        4. not paused
            5. queued >= depositThreshold
            6. queued < depositThreshold
    - `_withdraw`
        7. paused
        8. not paused
            9. assetInContract + maxWithdraw < amount
            10.assetInContract + maxWithdraw >= amount
                11. toWithdrawFromPool = amount > assetInContract
                12. toWithdrawFromPool = amount < assetInContract
            13. toWithdrawFromPool == 0
            14. toWithdrawFromPool != 0


## Findings 

1. Med/Low - User loses dust amount when withdrawing due to rounding error.

Description: running `test_no_withdrawal_loss_when_no_savings_accumulated` demonstrates the amount lost to rounding (1 DAI) with the failing assertion. This dust amount gets stuck in the strategy and can be logged in `test_user_can_always_fully_withdraw`. 

Impact: User loses dust amount to rounding, strategy accumulates dust. `depositQueue` mechanism would eventually end up redepositing this amount and it would earn savings without being withdrawable by the original owner, eventually accumulating a nontrivial amount.

Recommendation: implement rounding up so that the dust amount doesn't get stuck in the strategy

2. Med - `harvestable` always returns 0 

Description: `SDaiStrategy::harvestable` always returns a 0 value for the accumulated savings. When calling the same `sDai::maxWithdraw` function directly from the test contract this returns the correct value. Demonstrated in `test_harvestable_with_accumulation`.

Impact: any UI or integrating contracts reliant on this function will display an incorrect amount for the accumulated savings

Recommendation: unclear what the exact cause of the issue is (may be related to the inheritance structure?) so unclear how to resolve.

3. Low/Informational - `depositThreshold` isn't set in the constructor 

Description: `depositThreshold` isn't set in the constructor so defaults to 0.

Impact: if it ends up not getting set in the deploy script user funds would be deposited immediately, subverting the purpose of the queue

4. Low/Informtional - receive function seems unnecessary

Description: user can end up sending ETH to sDaiStrategy because of the receive function but there are no payable functions in the strategy so this seems like it add unnecessary risk.  

5. Informational - comments for `emergencyWithdraw` incorrect

Description: comments for `emergencyWithdraw` state that it "withdraws everything from the strategy" but it actually withdraws everything from sDai to the strategy.

6. Informational - unreachable statement 

Description: The NotEnough revert in _withdraw would never be reached in the case where strategy becomes insolvent, it reverts earlier in YieldBox::withdraw. This is demonstrated in `test_revert_when_strategy_balance_insufficient`. This is branch 9 in the above description of possible branches.