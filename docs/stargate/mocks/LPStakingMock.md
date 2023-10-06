# LPStakingMock









## Methods

### deposit

```solidity
function deposit(uint256, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| amount | uint256 | undefined |

### lpToken

```solidity
function lpToken() external view returns (contract ERC20Mock)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ERC20Mock | undefined |

### pendingStargate

```solidity
function pendingStargate(uint256, address) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### poolInfo

```solidity
function poolInfo(uint256) external view returns (address, uint256, uint256, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |
| _3 | uint256 | undefined |

### reward

```solidity
function reward() external view returns (contract ERC20Mock)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ERC20Mock | undefined |

### stargate

```solidity
function stargate() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### userInfo

```solidity
function userInfo(uint256, address) external view returns (uint256 amount, uint256 rewardDebt)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |
| rewardDebt | uint256 | undefined |

### withdraw

```solidity
function withdraw(uint256, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| amount | uint256 | undefined |




