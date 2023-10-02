# TricryptoLiquidityPoolMock









## Methods

### add_liquidity

```solidity
function add_liquidity(uint256[3] amounts, uint256) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amounts | uint256[3] | undefined |
| _1 | uint256 | undefined |

### calc_token_amount

```solidity
function calc_token_amount(uint256[3] amounts, bool) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amounts | uint256[3] | undefined |
| _1 | bool | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calc_withdraw_one_coin

```solidity
function calc_withdraw_one_coin(uint256 token_amount, uint256) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token_amount | uint256 | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### remove_liquidity_one_coin

```solidity
function remove_liquidity_one_coin(uint256 _token_amount, uint256, uint256) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token_amount | uint256 | undefined |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |

### token

```solidity
function token() external view returns (contract ERC20Mock)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ERC20Mock | undefined |

### weth

```solidity
function weth() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |




