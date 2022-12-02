# ITricryptoLPGetter









## Methods

### USDT

```solidity
function USDT() external view returns (address)
```

returns usdt address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### WBTC

```solidity
function WBTC() external view returns (address)
```

returns usdc address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### WETH

```solidity
function WETH() external view returns (address)
```

returns dai address




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

### liquidityPool

```solidity
function liquidityPool() external view returns (contract ITricryptoLiquidityPool)
```

returns curve&#39;s liquidity pool




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ITricryptoLiquidityPool | undefined |

### lpToken

```solidity
function lpToken() external view returns (address)
```

returns lp token address




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




