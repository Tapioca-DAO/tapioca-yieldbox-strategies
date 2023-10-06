# IStEth









## Methods

### balanceOf

```solidity
function balanceOf(address _user) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### isStakingPaused

```solidity
function isStakingPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### submit

```solidity
function submit(address _referral) external payable returns (uint256)
```

Send funds to the pool with optional _referral parameter

*This function is alternative way to submit funds. Supports optional referral address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _referral | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Amount of StETH shares generated |




