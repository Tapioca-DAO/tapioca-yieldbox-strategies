# ITricryptoLPGauge









## Methods

### balanceOf

```solidity
function balanceOf(address _addr) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claim_rewards

```solidity
function claim_rewards(address _addr, address _receiver) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined |
| _receiver | address | undefined |

### claimable_reward

```solidity
function claimable_reward(address _addr, address _token) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined |
| _token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claimable_reward_write

```solidity
function claimable_reward_write(address _addr, address _token) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined |
| _token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claimable_tokens

```solidity
function claimable_tokens(address _addr) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### crv_token

```solidity
function crv_token() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### deposit

```solidity
function deposit(uint256 _value, address _addr, bool _claim_rewards) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _value | uint256 | undefined |
| _addr | address | undefined |
| _claim_rewards | bool | undefined |

### withdraw

```solidity
function withdraw(uint256 value, bool _claim_rewards) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| value | uint256 | undefined |
| _claim_rewards | bool | undefined |




