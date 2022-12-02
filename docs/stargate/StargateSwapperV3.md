# StargateSwapperV3



> UniswapV3 swapper contract





## Methods

### owner

```solidity
function owner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### poolFee

```solidity
function poolFee() external view returns (uint24)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint24 | undefined |

### queryAmountOut

```solidity
function queryAmountOut(uint256 amountIn, address tokenIn, address tokenOut, address pool, bytes) external view returns (uint256 amountOut)
```

queries amount out for token in amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| amountIn | uint256 | the amount to query for |
| tokenIn | address | token to calculate for |
| tokenOut | address | token to be swapped with |
| pool | address | the UniswapV3 pool address |
| _4 | bytes | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| amountOut | uint256 | undefined |

### setPoolFee

```solidity
function setPoolFee(uint24 _newFee) external nonpayable
```

sets a new pool fee



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newFee | uint24 | the new value |

### swap

```solidity
function swap(uint256 amountIn, address tokenIn, address tokenOut, uint256 deadline, uint256 amountOutMin, bytes) external nonpayable returns (uint256 amountOut)
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
| _5 | bytes | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| amountOut | uint256 | undefined |

### swapRouter

```solidity
function swapRouter() external view returns (contract ISwapRouter)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ISwapRouter | undefined |



## Events

### PoolFee

```solidity
event PoolFee(uint256 _old, uint256 _new)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _old  | uint256 | undefined |
| _new  | uint256 | undefined |



