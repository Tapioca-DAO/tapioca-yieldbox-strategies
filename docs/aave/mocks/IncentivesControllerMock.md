# IncentivesControllerMock









## Methods

### REWARD_TOKEN

```solidity
function REWARD_TOKEN() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### claimRewards

```solidity
function claimRewards(address[], uint256, address to) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |
| _1 | uint256 | undefined |
| to | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getRewardsBalance

```solidity
function getRewardsBalance(address[], address) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getUserUnclaimedRewards

```solidity
function getUserUnclaimedRewards(address) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### token

```solidity
function token() external view returns (contract ERC20Mock)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ERC20Mock | undefined |




