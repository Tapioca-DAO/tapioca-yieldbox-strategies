# IGmxRewardTracker









## Methods

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### averageStakedAmounts

```solidity
function averageStakedAmounts(address _account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### balances

```solidity
function balances(address _account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claim

```solidity
function claim(address _receiver) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _receiver | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claimForAccount

```solidity
function claimForAccount(address _account, address _receiver) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |
| _receiver | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claimable

```solidity
function claimable(address _account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### cumulativeRewardPerToken

```solidity
function cumulativeRewardPerToken() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### cumulativeRewards

```solidity
function cumulativeRewards(address _account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### depositBalances

```solidity
function depositBalances(address _account, address _depositToken) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |
| _depositToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### distributor

```solidity
function distributor() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonpayable
```

EIP 2612



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |
| value | uint256 | undefined |
| deadline | uint256 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

### previousCumulatedRewardPerToken

```solidity
function previousCumulatedRewardPerToken(address _account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### rewardToken

```solidity
function rewardToken() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### stake

```solidity
function stake(address _depositToken, uint256 _amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _depositToken | address | undefined |
| _amount | uint256 | undefined |

### stakeForAccount

```solidity
function stakeForAccount(address _fundingAccount, address _account, address _depositToken, uint256 _amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _fundingAccount | address | undefined |
| _account | address | undefined |
| _depositToken | address | undefined |
| _amount | uint256 | undefined |

### stakedAmounts

```solidity
function stakedAmounts(address _account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### tokensPerInterval

```solidity
function tokensPerInterval() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### unstake

```solidity
function unstake(address _depositToken, uint256 _amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _depositToken | address | undefined |
| _amount | uint256 | undefined |

### unstakeForAccount

```solidity
function unstakeForAccount(address _account, address _depositToken, uint256 _amount, address _receiver) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined |
| _depositToken | address | undefined |
| _amount | uint256 | undefined |
| _receiver | address | undefined |

### updateRewards

```solidity
function updateRewards() external nonpayable
```








## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| spender `indexed` | address | undefined |
| value  | uint256 | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| value  | uint256 | undefined |



