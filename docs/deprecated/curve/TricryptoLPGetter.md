# TricryptoLPGetter









## Methods

### USDT

```solidity
function USDT() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### WBTC

```solidity
function WBTC() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### WETH

```solidity
function WETH() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### addLiquidityUsdt

```solidity
function addLiquidityUsdt(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add USDT liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation |
| _minAmount | uint256 | the min amount of LP token to be received |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### addLiquidityWbtc

```solidity
function addLiquidityWbtc(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add WBTC liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation |
| _minAmount | uint256 | the min amount of LP token to be received |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### addLiquidityWeth

```solidity
function addLiquidityWeth(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add WETH liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation |
| _minAmount | uint256 | the min amount of LP token to be received |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcLpToUsdt

```solidity
function calcLpToUsdt(uint256 _lpAmount) external view returns (uint256)
```

returns USDT amount for LP tokens



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lpAmount | uint256 | LP token amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcLpToWbtc

```solidity
function calcLpToWbtc(uint256 _lpAmount) external view returns (uint256)
```

returns WBTC amount for LP tokens



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lpAmount | uint256 | LP token amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcLpToWeth

```solidity
function calcLpToWeth(uint256 _lpAmount) external view returns (uint256)
```

returns WETH amount for LP tokens



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lpAmount | uint256 | LP token amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcUsdtToLp

```solidity
function calcUsdtToLp(uint256 _amount) external view returns (uint256)
```

returns LP amount for USDT



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | token amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcWbtcToLp

```solidity
function calcWbtcToLp(uint256 _amount) external view returns (uint256)
```

returns LP amount for WBTC



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | token amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcWethToLp

```solidity
function calcWethToLp(uint256 _amount) external view returns (uint256)
```

returns LP amount for WETH



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | token amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### claimOwnership

```solidity
function claimOwnership() external nonpayable
```

Needs to be called by `pendingOwner` to claim ownership.




### liquidityPool

```solidity
function liquidityPool() external view returns (contract ITricryptoLiquidityPool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ITricryptoLiquidityPool | undefined |

### lpToken

```solidity
function lpToken() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

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

### removeLiquidityUsdt

```solidity
function removeLiquidityUsdt(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get USDT



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation |
| _minAmount | uint256 | the min amount of token to be received |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### removeLiquidityWbtc

```solidity
function removeLiquidityWbtc(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get WBTC



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation |
| _minAmount | uint256 | the min amount of token to be received |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### removeLiquidityWeth

```solidity
function removeLiquidityWeth(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get WETH



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation |
| _minAmount | uint256 | the min amount of token to be received |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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



## Events

### AddedLiquidity

```solidity
event AddedLiquidity(address indexed token, uint256 indexed amount, uint256 indexed obtainedLP)
```

event emitted when liquidity was added



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amount `indexed` | uint256 | undefined |
| obtainedLP `indexed` | uint256 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### RemovedLiquidity

```solidity
event RemovedLiquidity(address indexed token, uint256 indexed amountLP, uint256 indexed obtainedAssets)
```

event emitted when liquidity was added



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amountLP `indexed` | uint256 | undefined |
| obtainedAssets `indexed` | uint256 | undefined |



