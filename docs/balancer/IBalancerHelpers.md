# IBalancerHelpers









## Methods

### queryExit

```solidity
function queryExit(bytes32 poolId, address sender, address recipient, IBalancerVault.ExitPoolRequest request) external nonpayable returns (uint256 bptIn, uint256[] amountsOut)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| poolId | bytes32 | undefined |
| sender | address | undefined |
| recipient | address | undefined |
| request | IBalancerVault.ExitPoolRequest | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| bptIn | uint256 | undefined |
| amountsOut | uint256[] | undefined |

### queryJoin

```solidity
function queryJoin(bytes32 poolId, address sender, address recipient, IBalancerVault.JoinPoolRequest request) external nonpayable returns (uint256 bptOut, uint256[] amountsIn)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| poolId | bytes32 | undefined |
| sender | address | undefined |
| recipient | address | undefined |
| request | IBalancerVault.JoinPoolRequest | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| bptOut | uint256 | undefined |
| amountsIn | uint256[] | undefined |




