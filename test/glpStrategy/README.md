## Specifications tested in GlpStrategy

1. tsGLP passed in on deposit is staked for GlpStrategy [x]
2. GLP bought with weth rewards is staked for GlpStrategy [x]
3. Harvesting uses all the weth rewards balance if it's nonzero [x]
4. Only YieldBox can withdraw and deposit [x]
5. Depositing sGLP directly to strategy should fail [x]
6. Calling harvest with 0 rewards accumulated doesn't revert [x]
7. User balance of sGLP increases by amount on call to withdraw [x]
8. GlpStrategy balance of sGLP decreases on withdrawal [x]
9. User can always withdraw up to the full amount of GLP + weth rewards in the GlpStrategy [x]
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

1. Med/Low - `pendingRewards` calculation doesn't correspond 1:1 with amounts earned in harvesting 

Description: Amount returned by `pendingRewards` differs from the actual rewards accumulated for a given accumulation period.

POC: In `test_weth_rewards_staked_as_glp` it's demonstrated that the reward delta actually received by the strategy is greater than what's predicted by `pendingRewards` in the following assertion which fails:

```solidity
 assertTrue(
            rewardsAccumulatedBeforeHarvest ==
                strategyGLPBalanceAfterHarvest -
                    strategyGLPBalanceBeforeHarvest,
            "actual GLP delta different from predicted"
        );
```

Impact: Any integrating protocols using `pendingRewards` would receive incorrect values that may effect their logic if they expect it to return an accurate value for the accumulated rewards.

Recommendation: This is most likely an issue related to the MockOracle implementation used in the test setup, which uses a fixed rate of 1e18, integrating the actual tapioca ETH/GLP oracle in the setup will likely result in a more accurate calculation of the expected rewards.  

2. Informational - Full reward amount can only be withdrawn with shares for first depositor

Description: The first depositor into GlpStrategy will have all shares allocated to them (shares[depositor] == totalSupply), but due to rounding in YieldBox, if they have accumulated rewards on their deposit and try to withdraw by passing in the balance of the strategy (which they are owed), the conversion of the amount they are withdrawing is > totalSupply of shares, they are therefore only able to withdraw their full amount by passing in the totalSupply of shares. 

POC:
Adding the following console logs to the ERC1155 contract's `_burn` function: 

```solidity
function _burn(address from, uint256 id, uint256 value) internal {
        require(from != address(0), "No 0 address");

        console2.log(
            "total supply of shares less than redeemed amount: ",
            totalSupply[id] < value
        );
        console2.log("total supply of shares: %e", totalSupply[id]);

        balanceOf[from][id] -= value;
        totalSupply[id] -= value;
```

demonstrates that when running the `test_rewards_always_withdrawable` test where a user tries to withdraw their entire initial deposit + yield earned, the following line from the test triggers a revert in the `_burn` function:

```solidity
uint256 totalSupplyOfShares = yieldBox.totalSupply(glpStratAssetId);
        yieldBox.withdraw(
            glpStratAssetId,
            binanceWalletAddr,
            binanceWalletAddr,
            0,
            totalSupplyOfShares
        );
```
because the rounding up of shares in `YieldBox::_withdrawFungible` which allocates more shares to the user than the totalSupply:

```solidity
function _withdrawFungible(
        Asset storage asset,
        uint256 assetId,
        address from,
        address to,
        uint256 amount,
        uint256 share
    ) internal returns (uint256 amountOut, uint256 shareOut) {
        // Effects
        uint256 totalAmount = _tokenBalanceOf(asset);
        if (share == 0) {
            // value of the share paid could be lower than the amount paid due to rounding, in that case, add a share (Always round up)
            share = amount._toShares(totalSupply[assetId], totalAmount, true);
		...
		}
	}
```

This same issue is demonstrated in `test_rewards_always_withdrawable_multiple` where if multiple users deposit and withdraw, if the last user attempts to withdraw the remaining balance of sGLP in the strategy (which should correspond to their amount of shares), it also triggers and underflow revert in the ERC1155 `_burn` function due to the following line: 

```solidity
 		// Bob tries to withdraw his amount which should be the remaining balance of the strategy
        vm.startPrank(bob);
        uint256 amountRemainingInStrategy = sGLP.balanceOf(
            address(glpStrategy)
        );

        yieldBox.withdraw(glpStratAssetId, bob, bob, amountRemainingInStrategy, 0);
        vm.stopPrank();
```


Recommendation: This issue can be mitigated by ensuring front-end logic prevents this edge case or only allowing sole depositors to withdraw by passing in shares. 

3. Informational - Unclear natspec

Description: The ITapiocaOracle natspec states that the `get` function:

```solidity
@return success if no valid (recent) rate is available, return false else true.
```

Impact: This would imply that calls to `get` in `_buyGlp` would revert if there IS a valid recent rate returned by the oracle, and only pass if there is NOT a valid recent rate due to the following lines: 

Lines affected: 
```solidity
(success, glpPrice) = wethGlpOracle.get(wethGlpOracleData);
    if (!success) revert Failed();
```

The natspec makes understanding the effect in the resulting implementation difficult to discern.

Recommendation: rephrase natspec for clearer definition of function or change return variable name to make definition clearer

4. Informational - user trying to overdraw their account shares could receive more descriptive message

Description: In test `test_user_cant_overdraw` it reverts due to underflow when user tries to withdraw more than their balance, throwing a more descriptive error could allow for better error handling.


