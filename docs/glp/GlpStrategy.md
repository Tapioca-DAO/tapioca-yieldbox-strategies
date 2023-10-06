# GlpStrategy









## Methods

### cheapWithdrawable

```solidity
function cheapWithdrawable() external view returns (uint256 amount)
```

Returns the maximum amount that can be withdrawn for a low gas fee When more than this amount is withdrawn it will trigger divesting from the actual strategy which will incur higher gas costs




#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### claimOwnership

```solidity
function claimOwnership() external nonpayable
```

Needs to be called by `pendingOwner` to claim ownership.




### contractAddress

```solidity
function contractAddress() external view returns (address)
```

Returns the contract address that this strategy works with




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### currentBalance

```solidity
function currentBalance() external view returns (uint256 amount)
```

Returns the total value the strategy holds (principle + gain) expressed in asset token amount. This should be cheap in gas to retrieve. Can return a bit less than the actual, but MUST NOT return more. The gas cost of this function will be paid on any deposit or withdrawal onto and out of the YieldBox that uses this strategy. Also, anytime a protocol converts between shares and amount, this gets called.




#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### deposited

```solidity
function deposited(uint256 amount) external nonpayable
```

Is called by YieldBox to signal funds have been added, the strategy may choose to act on this When a large enough deposit is made, this should trigger the strategy to invest into the actual strategy. This function should normally NOT be used to invest on each call as that would be costly for small deposits. If the strategy handles native tokens (ETH) it will receive it directly (not wrapped). It will be up to the strategy to wrap it if needed. Only accept this call from the YieldBox



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### description

```solidity
function description() external view returns (string)
```

Returns a description for this strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### emergencyWithdraw

```solidity
function emergencyWithdraw() external nonpayable returns (uint256 result)
```

withdraws everythig from the strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| result | uint256 | undefined |

### feeRecipient

```solidity
function feeRecipient() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### feesPending

```solidity
function feesPending() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### gmxGlpOracle

```solidity
function gmxGlpOracle() external view returns (contract IOracle)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IOracle | undefined |

### gmxGlpOracleData

```solidity
function gmxGlpOracleData() external view returns (bytes)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined |

### harvest

```solidity
function harvest() external nonpayable
```






### harvestGmx

```solidity
function harvestGmx(uint256 priceNum, uint256 priceDenom) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| priceNum | uint256 | undefined |
| priceDenom | uint256 | undefined |

### name

```solidity
function name() external view returns (string)
```

Returns a name for this strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### owner

```solidity
function owner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### paused

```solidity
function paused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### pendingOwner

```solidity
function pendingOwner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### setFeeRecipient

```solidity
function setFeeRecipient(address recipient) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient | address | undefined |

### setSlippage

```solidity
function setSlippage(uint256 _val) external nonpayable
```

sets the slippage used in swap operations



#### Parameters

| Name | Type | Description |
|---|---|---|
| _val | uint256 | the new slippage amount |

### tokenId

```solidity
function tokenId() external view returns (uint256)
```

Returns the tokenId that this strategy works with (for EIP1155) This is always 0 for EIP20 tokens




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### tokenType

```solidity
function tokenType() external view returns (enum TokenType)
```

Returns the standard that this strategy works with




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | enum TokenType | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner, bool direct, bool renounce) external nonpayable
```

Transfers ownership to `newOwner`. Either directly or claimable by the new pending owner. Can only be invoked by the current `owner`.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | Address of the new owner. |
| direct | bool | True if `newOwner` should be set immediately. False if `newOwner` needs to use `claimOwnership`. |
| renounce | bool | Allows the `newOwner` to be `address(0)` if `direct` and `renounce` is True. Has no effect otherwise. |

### uniswapV3SwapCallback

```solidity
function uniswapV3SwapCallback(int256, int256, bytes data) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | int256 | undefined |
| _1 | int256 | undefined |
| data | bytes | undefined |

### updatePaused

```solidity
function updatePaused(bool _val) external nonpayable
```

updates the pause state



#### Parameters

| Name | Type | Description |
|---|---|---|
| _val | bool | the new state |

### wethGlpOracle

```solidity
function wethGlpOracle() external view returns (contract IOracle)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IOracle | undefined |

### wethGlpOracleData

```solidity
function wethGlpOracleData() external view returns (bytes)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined |

### wethUsdgOracle

```solidity
function wethUsdgOracle() external view returns (contract IOracle)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IOracle | undefined |

### wethUsdgOracleData

```solidity
function wethUsdgOracleData() external view returns (bytes)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined |

### withdraw

```solidity
function withdraw(address to, uint256 amount) external nonpayable
```

Is called by the YieldBox to ask the strategy to withdraw to the user When a strategy keeps a little reserve for cheap withdrawals and the requested withdrawal goes over this amount, the strategy should divest enough from the strategy to complete the withdrawal and rebalance the reserve. If the strategy handles native tokens (ETH) it should send this, not a wrapped version. With some strategies it might be hard to withdraw exactly the correct amount. Only accept this call from the YieldBox



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| amount | uint256 | undefined |

### withdrawFees

```solidity
function withdrawFees() external nonpayable
```






### withdrawable

```solidity
function withdrawable() external view returns (uint256 amount)
```

Returns the maximum amount that can be withdrawn




#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### yieldBox

```solidity
function yieldBox() external view returns (contract IYieldBox)
```

Returns the address of the yieldBox that this strategy is for




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IYieldBox | undefined |



## Events

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



