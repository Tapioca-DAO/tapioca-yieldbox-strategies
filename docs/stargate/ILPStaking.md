# ILPStaking









## Methods

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _pid | uint256 | undefined |
| _amount | uint256 | undefined |

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _pid | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pendingStargate

```solidity
function pendingStargate(uint256 _pid, address _user) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _pid | uint256 | undefined |
| _user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### poolInfo

```solidity
function poolInfo(uint256 _index) external view returns (address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accStargatePerShare)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| lpToken | address | undefined |
| allocPoint | uint256 | undefined |
| lastRewardBlock | uint256 | undefined |
| accStargatePerShare | uint256 | undefined |

### poolLength

```solidity
function poolLength() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### setStargatePerBlock

```solidity
function setStargatePerBlock(uint256 _stargatePerBlock) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _stargatePerBlock | uint256 | undefined |

### stargate

```solidity
function stargate() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### stargatePerBlock

```solidity
function stargatePerBlock() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### updatePool

```solidity
function updatePool(uint256 _pid) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _pid | uint256 | undefined |

### userInfo

```solidity
function userInfo(uint256 _pid, address _user) external view returns (uint256 amount, uint256 rewardDebt)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _pid | uint256 | undefined |
| _user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |
| rewardDebt | uint256 | undefined |

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _pid | uint256 | undefined |
| _amount | uint256 | undefined |




