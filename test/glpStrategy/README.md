## Specifications tested in GlpStrategy

1. tsGLP passed in on deposit is staked for GlpStrategy [x]
2. GLP bought with weth rewards is staked for GlpStrategy [x] NOTE:rewards received are greater than those predicted by `pendingRewards`
3. harvesting uses all the weth rewards balance if it's nonzero [x]
4. only YieldBox can withdraw and deposit [x]
5. depositing sGLP directly to strategy should fail [x]
6. calling harvest with 0 rewards accumulated doesn't revert [x]
7. user balance of sGLP increases by amount on call to withdraw [x]
8. GlpStrategy balance of sGLP decreases on withdrawal [x]
9. YieldBox can always withdraw up to the full amount of GLP + weth rewards in the GlpStrategy (WIP)
10. User can only withdraw yield accumulated for their shares [x]

## Coverage

- possible branches
	- `setSlippage` 
		1. slippage less than max `test_setSlippage`
		2. slippage greater than max `test_max_slippage_reverts`
	- `_deposited`
		3. deposits paused `test_paused`
		4. deposits unpaused (all other deposit tests)
	- `_withdraw`
		5. withdrawing 0 `test_withdraw_zero_reverts`
		6. withdrawing > 0 (all other withdraw tests)
	- `_buyGlp`
		7. wethAmount > 0
			8. call to `wethGlpOracle` returns success == false `test_harvest_oracle_not_successful`
			9. call to `wethGlpOracle` doesn't revert
				10. `safeApprove` token isn't contract `test_safeApprove_not_contract`
				11. `safeApprove` token is contract
					12. approving 0 address call fails `test_safeApprove_approve_zero_address_failure`
					13. second approval in call trace fails `test_safeApprove_fails_second_approval` 
		14. wethAmount == 0 `test_harvest_zero`

## Findings 

1. High - `pendingRewards` calculation is incorrect 

Description: In `test_weth_rewards_staked_as_glp` it's demonstrated that the reward delta actually received by the strategy is greater than what's predicted by `pendingRewards`. Also demonstrated in `test_pending_not_correct`. 

Impact: Internal logic that calls `pendingRewards` incorrectly calculates strategy rewards, any integrating protocols using this would receive incorrect values that may effect their logic.

Recommendation: Change the implementation of `pendingRewards` to calculated minted sGLP amount in the same manner that the RewardRouter from GMX does. 

2. Med - slippage accumulates in strategy

Description: When a user tries to withdraw their initial deposit + yield earned they can only withdraw a total amount that accounts for slippage, due to the logic in _buyGlp meant to account for price slippage. This results in the slippage amount which is actually minted to the user remaining in the strategy. See test `test_rewards_always_withdrawable` for demonstration of this issue, in the second call to `_withdrawFromStrategy` the amount left over in the contract from the slippage calculation is unable to be withdrawn, if this amount isn't taken into account in the initial withdrawal the call reverts due to underflow.

Impact: The slippage amount accumulates in the strategy and isn't properly sent to the user even though it's been minted. 

Recommendation: Fix `claimable` logic to reflect actual rewards distributed to user.

3. Informational - Unclear natspec

Description: The ITapiocaOracle natspec states that the `get` function:
> @return success if no valid (recent) rate is available, return false else true.

Calls to _buyGlp would therefore revert if there's a recent change in price in the oracle due to the following lines: 

```solidity
(success, glpPrice) = wethGlpOracle.get(wethGlpOracleData);
    if (!success) revert Failed();
```

This seems to imply that only non-recent prices are valid, but isn't the case with the resulting implementation tested.

4. Informational - user trying to overdraw their account shares could receive more descriptive message

Description: In test `test_user_cant_overdraw` it reverts due to underflow when user tries to withdraw more than their balance, throwing a more descriptive error could allow for better error handling.


