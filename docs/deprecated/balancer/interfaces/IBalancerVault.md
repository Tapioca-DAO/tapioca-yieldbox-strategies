# IBalancerVault









## Methods

### exitPool

```solidity
function exitPool(bytes32 poolId, address sender, address payable recipient, IBalancerVault.ExitPoolRequest request) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| poolId | bytes32 | undefined |
| sender | address | undefined |
| recipient | address payable | undefined |
| request | IBalancerVault.ExitPoolRequest | undefined |

### getPool

```solidity
function getPool(bytes32 poolId) external view returns (address, enum IBalancerVault.PoolSpecialization)
```



*Returns a Pool&#39;s contract address and specialization setting.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| poolId | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | enum IBalancerVault.PoolSpecialization | undefined |

### getPoolTokens

```solidity
function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| poolId | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| tokens | address[] | undefined |
| balances | uint256[] | undefined |
| lastChangeBlock | uint256 | undefined |

### joinPool

```solidity
function joinPool(bytes32 poolId, address sender, address recipient, IBalancerVault.JoinPoolRequest request) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| poolId | bytes32 | undefined |
| sender | address | undefined |
| recipient | address | undefined |
| request | IBalancerVault.JoinPoolRequest | undefined |

### swap

```solidity
function swap(IBalancerVault.SingleSwap singleSwap, IBalancerVault.FundManagement funds, uint256 limit, uint256 deadline) external nonpayable returns (uint256 amountCalculated)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| singleSwap | IBalancerVault.SingleSwap | undefined |
| funds | IBalancerVault.FundManagement | undefined |
| limit | uint256 | undefined |
| deadline | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| amountCalculated | uint256 | undefined |




