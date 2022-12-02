# ILendingPool









## Methods

### borrow

```solidity
function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external nonpayable
```



*Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower already deposited enough collateral, or he was given enough allowance by a credit delegator on the corresponding debt token (StableDebtToken or VariableDebtToken) - E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet   and 100 stable/variable debt tokens, depending on the `interestRateMode`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| interestRateMode | uint256 | The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |
| onBehalfOf | address | Address of the user who will receive the debt. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance* |

### deposit

```solidity
function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external nonpayable
```



*Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens. - E.g. User deposits 100 USDC and gets in return 100 aUSDC*

#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the underlying asset to deposit |
| amount | uint256 | The amount to be deposited |
| onBehalfOf | address | The address that will receive the aTokens, same as msg.sender if the user   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens   is a different wallet |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man* |

### flashLoan

```solidity
function flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode) external nonpayable
```



*Allows smartcontracts to access the liquidity of the pool within one transaction, as long as the amount taken plus a fee is returned. IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept into consideration. For further details please visit https://developers.aave.com*

#### Parameters

| Name | Type | Description |
|---|---|---|
| receiverAddress | address | The address of the contract receiving the funds, implementing the IFlashLoanReceiver interface |
| assets | address[] | The addresses of the assets being flash-borrowed |
| amounts | uint256[] | The amounts amounts being flash-borrowed |
| modes | uint256[] | Types of the debt to open if the flash loan is not returned:   0 -&gt; Don&#39;t open any debt, just revert if funds can&#39;t be transferred from the receiver   1 -&gt; Open debt at stable rate for the value of the amount flash-borrowed to the `onBehalfOf` address   2 -&gt; Open debt at variable rate for the value of the amount flash-borrowed to the `onBehalfOf` address |
| onBehalfOf | address | The address  that will receive the debt in the case of using on `modes` 1 or 2 |
| params | bytes | Variadic packed params to pass to the receiver as extra information |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man* |

### getUserAccountData

```solidity
function getUserAccountData(address user) external view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)
```



*Returns the user account data across all the reserves*

#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | The address of the user |

#### Returns

| Name | Type | Description |
|---|---|---|
| totalCollateralETH | uint256 | the total collateral in ETH of the user |
| totalDebtETH | uint256 | the total debt in ETH of the user |
| availableBorrowsETH | uint256 | the borrowing power left of the user |
| currentLiquidationThreshold | uint256 | the liquidation threshold of the user |
| ltv | uint256 | the loan to value of the user |
| healthFactor | uint256 | the current health factor of the user* |

### liquidationCall

```solidity
function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken) external nonpayable
```



*Function to liquidate a non-healthy position collateral-wise, with Health Factor below 1 - The caller (liquidator) covers `debtToCover` amount of debt of the user getting liquidated, and receives   a proportionally amount of the `collateralAsset` plus a bonus to cover market risk*

#### Parameters

| Name | Type | Description |
|---|---|---|
| collateralAsset | address | The address of the underlying asset used as collateral, to receive as result of the liquidation |
| debtAsset | address | The address of the underlying borrowed asset to be repaid with the liquidation |
| user | address | The address of the borrower getting liquidated |
| debtToCover | uint256 | The debt amount of borrowed `asset` the liquidator wants to cover |
| receiveAToken | bool | `true` if the liquidators wants to receive the collateral aTokens, `false` if he wants to receive the underlying collateral asset directly* |

### paused

```solidity
function paused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### rebalanceStableBorrowRate

```solidity
function rebalanceStableBorrowRate(address asset, address user) external nonpayable
```



*Rebalances the stable interest rate of a user to the current stable rate defined on the reserve. - Users can be rebalanced if the following conditions are satisfied:     1. Usage ratio is above 95%     2. the current deposit APY is below REBALANCE_UP_THRESHOLD * maxVariableBorrowRate, which means that too much has been        borrowed at a stable rate and depositors are not earning enough*

#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the underlying asset borrowed |
| user | address | The address of the user to be rebalanced* |

### repay

```solidity
function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external nonpayable returns (uint256)
```

Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned - E.g. User repays 100 USDC, burning 100 variable/stable debt tokens of the `onBehalfOf` address



#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the borrowed underlying asset previously borrowed |
| amount | uint256 | The amount to repay - Send the value type(uint256).max in order to repay the whole debt for `asset` on the specific `debtMode` |
| rateMode | uint256 | The interest rate mode at of the debt the user wants to repay: 1 for Stable, 2 for Variable |
| onBehalfOf | address | Address of the user who will get his debt reduced/removed. Should be the address of the user calling the function if he wants to reduce/remove his own debt, or the address of any other other borrower whose debt should be removed |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The final amount repaid* |

### setUserUseReserveAsCollateral

```solidity
function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external nonpayable
```



*Allows depositors to enable/disable a specific deposited asset as collateral*

#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the underlying asset deposited |
| useAsCollateral | bool | `true` if the user wants to use the deposit as collateral, `false` otherwise* |

### swapBorrowRateMode

```solidity
function swapBorrowRateMode(address asset, uint256 rateMode) external nonpayable
```



*Allows a borrower to swap his debt between stable and variable mode, or viceversa*

#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the underlying asset borrowed |
| rateMode | uint256 | The rate mode that the user wants to swap to* |

### withdraw

```solidity
function withdraw(address asset, uint256 amount, address to) external nonpayable returns (uint256)
```



*Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC*

#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | The address of the underlying asset to withdraw |
| amount | uint256 | The underlying amount to be withdrawn   - Send the value type(uint256).max in order to withdraw the whole aToken balance |
| to | address | Address that will receive the underlying, same as msg.sender if the user   wants to receive it on his own wallet, or a different address if the beneficiary is a   different wallet |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The final amount withdrawn* |




