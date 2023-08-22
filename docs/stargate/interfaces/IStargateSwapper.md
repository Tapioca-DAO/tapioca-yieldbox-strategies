# IStargateSwapper









## Methods

### queryAmountOut

```solidity
function queryAmountOut(uint256 amountIn, address tokenIn, address tokenOut, address pool, bytes data) external view returns (uint256 amountOut)
```

queries amount out for token in amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| amountIn | uint256 | the amount to query for |
| tokenIn | address | token to calculate for |
| tokenOut | address | token to be swapped with |
| pool | address | the UniswapV3 pool address |
| data | bytes | extra data |

#### Returns

| Name | Type | Description |
|---|---|---|
| amountOut | uint256 | undefined |

### swap

```solidity
function swap(uint256 amountIn, address tokenIn, address tokenOut, uint256 deadline, uint256 amountOutMin, bytes data) external nonpayable returns (uint256 amountOut)
```

swaps tokenIn to tokenOut



#### Parameters

| Name | Type | Description |
|---|---|---|
| amountIn | uint256 | the swap amount |
| tokenIn | address | swapped token |
| tokenOut | address | token to be swapped with |
| deadline | uint256 | the unix time after which a swap will fail, to protect against long-pending transactions and wild swings in prices |
| amountOutMin | uint256 | the minimum amount to be received from the swap operation |
| data | bytes | extra data |

#### Returns

| Name | Type | Description |
|---|---|---|
| amountOut | uint256 | undefined |




