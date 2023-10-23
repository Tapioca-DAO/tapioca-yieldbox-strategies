# LendingPoolMock









## Methods

### asset

```solidity
function asset() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### deposit

```solidity
function deposit(address, uint256 amount, address, uint16) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| amount | uint256 | undefined |
| _2 | address | undefined |
| _3 | uint16 | undefined |

### getUserAccountData

```solidity
function getUserAccountData(address) external view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| totalCollateralETH | uint256 | undefined |
| totalDebtETH | uint256 | undefined |
| availableBorrowsETH | uint256 | undefined |
| currentLiquidationThreshold | uint256 | undefined |
| ltv | uint256 | undefined |
| healthFactor | uint256 | undefined |

### withdraw

```solidity
function withdraw(address, uint256 amount, address to) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| amount | uint256 | undefined |
| to | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |




