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

## Branches Covered in GlpStrategy Tests

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

1. ITapiocaOracle natspec states that the `get` function:
> @return success if no valid (recent) rate is available, return false else true.

Calls to _buyGlp would therefore revert is there is a recent change in price in the oracle due to the following lines: 

```solidity
(success, glpPrice) = wethGlpOracle.get(wethGlpOracleData);
    if (!success) revert Failed();
```

This seems to imply that only non-recent prices are valid. 

2. When trying to withdraw the full amount before the 15 minute cooldown period for sGLP the `_withdraw` function reverts. See test `test_always_withdrawable` for a proof of concept and description of this issue. 

