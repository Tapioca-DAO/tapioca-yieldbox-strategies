# BalancerVaultMock









## Methods

### exitPool

```solidity
function exitPool(bytes32, address sender, address payable recipient, IBalancerVault.ExitPoolRequest request) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |
| sender | address | undefined |
| recipient | address payable | undefined |
| request | IBalancerVault.ExitPoolRequest | undefined |

### getPool

```solidity
function getPool(bytes32) external view returns (address, enum IBalancerVault.PoolSpecialization)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | enum IBalancerVault.PoolSpecialization | undefined |

### getPoolTokens

```solidity
function getPoolTokens(bytes32) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| tokens | address[] | undefined |
| balances | uint256[] | undefined |
| lastChangeBlock | uint256 | undefined |

### joinPool

```solidity
function joinPool(bytes32, address sender, address recipient, IBalancerVault.JoinPoolRequest request) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |
| sender | address | undefined |
| recipient | address | undefined |
| request | IBalancerVault.JoinPoolRequest | undefined |

### stablePool

```solidity
function stablePool() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### weth

```solidity
function weth() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |




