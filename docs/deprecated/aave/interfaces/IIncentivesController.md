# IIncentivesController









## Methods

### REWARD_TOKEN

```solidity
function REWARD_TOKEN() external view returns (address)
```



*for backward compatibility with previous implementation of the Incentives controller*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### claimRewards

```solidity
function claimRewards(address[] assets, uint256 amount, address to) external nonpayable returns (uint256)
```



*Claims reward for an user, on all the assets of the lending pool, accumulating the pending rewards*

#### Parameters

| Name | Type | Description |
|---|---|---|
| assets | address[] | undefined |
| amount | uint256 | Amount of rewards to claim |
| to | address | Address that will be receiving the rewards |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Rewards claimed* |

### getRewardsBalance

```solidity
function getRewardsBalance(address[] assets, address user) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| assets | address[] | undefined |
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getUserUnclaimedRewards

```solidity
function getUserUnclaimedRewards(address user) external view returns (uint256)
```



*returns the unclaimed rewards of the user*

#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | the address of the user |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | the unclaimed user rewards |




