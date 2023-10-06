# TricryptoNativeStrategy









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




### compound

```solidity
function compound(bytes) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined |

### compoundAmount

```solidity
function compoundAmount() external nonpayable returns (uint256 result)
```

returns compounded amounts in wrappedNative




#### Returns

| Name | Type | Description |
|---|---|---|
| result | uint256 | undefined |

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

### depositThreshold

```solidity
function depositThreshold() external view returns (uint256)
```

Queues tokens up to depositThreshold

*When the amount of tokens is greater than the threshold, a deposit operation to AAVE is performed*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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
function description() external pure returns (string description_)
```

Returns the description of this strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| description_ | string | undefined |

### emergencyWithdraw

```solidity
function emergencyWithdraw() external nonpayable returns (uint256 result)
```

withdraws everythig from the strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| result | uint256 | undefined |

### lpGauge

```solidity
function lpGauge() external view returns (contract ITricryptoLPGauge)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ITricryptoLPGauge | undefined |

### lpGetter

```solidity
function lpGetter() external view returns (contract ITricryptoLPGetter)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ITricryptoLPGetter | undefined |

### minter

```solidity
function minter() external view returns (contract ICurveMinter)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurveMinter | undefined |

### name

```solidity
function name() external pure returns (string name_)
```

Returns the name of this strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| name_ | string | undefined |

### owner

```solidity
function owner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pendingOwner

```solidity
function pendingOwner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### rewardToken

```solidity
function rewardToken() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### setDepositThreshold

```solidity
function setDepositThreshold(uint256 amount) external nonpayable
```

Sets the deposit threshold



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | The new threshold amount |

### setMultiSwapper

```solidity
function setMultiSwapper(address _swapper) external nonpayable
```

Sets the Swapper address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _swapper | address | The new swapper address |

### setSlippage

```solidity
function setSlippage(uint256 _val) external nonpayable
```

sets the slippage used in swap operations



#### Parameters

| Name | Type | Description |
|---|---|---|
| _val | uint256 | the new slippage amount |

### setTricryptoLPGetter

```solidity
function setTricryptoLPGetter(address _lpGetter) external nonpayable
```

Sets the Tricrypto LP Getter



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lpGetter | address | the new address |

### swapper

```solidity
function swapper() external view returns (contract ISwapper)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ISwapper | undefined |

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

### withdrawable

```solidity
function withdrawable() external view returns (uint256 amount)
```

Returns the maximum amount that can be withdrawn




#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### wrappedNative

```solidity
function wrappedNative() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

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

### AmountDeposited

```solidity
event AmountDeposited(uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |

### AmountQueued

```solidity
event AmountQueued(uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |

### AmountWithdrawn

```solidity
event AmountWithdrawn(address indexed to, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |

### DepositThreshold

```solidity
event DepositThreshold(uint256 _old, uint256 _new)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _old  | uint256 | undefined |
| _new  | uint256 | undefined |

### LPGetterSet

```solidity
event LPGetterSet(address indexed _old, address indexed _new)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### MultiSwapper

```solidity
event MultiSwapper(address indexed _old, address indexed _new)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



