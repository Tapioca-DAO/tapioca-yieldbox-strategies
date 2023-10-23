# IAaveV3Pool









## Methods

### getUserAccountData

```solidity
function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| totalCollateralBase | uint256 | undefined |
| totalDebtBase | uint256 | undefined |
| availableBorrowsBase | uint256 | undefined |
| currentLiquidationThreshold | uint256 | undefined |
| ltv | uint256 | undefined |
| healthFactor | uint256 | undefined |

### supply

```solidity
function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | undefined |
| amount | uint256 | undefined |
| onBehalfOf | address | undefined |
| referralCode | uint16 | undefined |

### withdraw

```solidity
function withdraw(address asset, uint256 amount, address to) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | undefined |
| amount | uint256 | undefined |
| to | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |




