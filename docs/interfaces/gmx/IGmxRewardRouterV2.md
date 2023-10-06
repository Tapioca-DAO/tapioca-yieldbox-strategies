# IGmxRewardRouterV2









## Methods

### esGmx

```solidity
function esGmx() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### feeGlpTracker

```solidity
function feeGlpTracker() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### feeGmxTracker

```solidity
function feeGmxTracker() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### glpManager

```solidity
function glpManager() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### glpVester

```solidity
function glpVester() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### gmx

```solidity
function gmx() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### gmxVester

```solidity
function gmxVester() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### handleRewards

```solidity
function handleRewards(bool _shouldClaimGmx, bool _shouldStakeGmx, bool _shouldClaimEsGmx, bool _shouldStakeEsGmx, bool _shouldStakeMultiplierPoints, bool _shouldClaimWeth, bool _shouldConvertWethToEth) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _shouldClaimGmx | bool | undefined |
| _shouldStakeGmx | bool | undefined |
| _shouldClaimEsGmx | bool | undefined |
| _shouldStakeEsGmx | bool | undefined |
| _shouldStakeMultiplierPoints | bool | undefined |
| _shouldClaimWeth | bool | undefined |
| _shouldConvertWethToEth | bool | undefined |

### mintAndStakeGlp

```solidity
function mintAndStakeGlp(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minGlp) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | undefined |
| _amount | uint256 | undefined |
| _minUsdg | uint256 | undefined |
| _minGlp | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### mintAndStakeGlpETH

```solidity
function mintAndStakeGlpETH(uint256 _minUsdg, uint256 _minGlp) external payable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _minUsdg | uint256 | undefined |
| _minGlp | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### stakeEsGmx

```solidity
function stakeEsGmx(uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### stakedGlpTracker

```solidity
function stakedGlpTracker() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### stakedGmxTracker

```solidity
function stakedGmxTracker() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### unstakeEsGmx

```solidity
function unstakeEsGmx(uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### weth

```solidity
function weth() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |




