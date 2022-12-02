# IRouter









## Methods

### addLiquidity

```solidity
function addLiquidity(uint256 _poolId, uint256 _amountLD, address _to) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _poolId | uint256 | undefined |
| _amountLD | uint256 | undefined |
| _to | address | undefined |

### instantRedeemLocal

```solidity
function instantRedeemLocal(uint16 _srcPoolId, uint256 _amountLP, address _to) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _srcPoolId | uint16 | undefined |
| _amountLP | uint256 | undefined |
| _to | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### quoteLayerZeroFee

```solidity
function quoteLayerZeroFee(uint16 _dstChainId, uint8 _functionType, bytes _toAddress, bytes _transferAndCallPayload, IRouter.lzTxObj _lzTxParams) external view returns (uint256, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _dstChainId | uint16 | undefined |
| _functionType | uint8 | undefined |
| _toAddress | bytes | undefined |
| _transferAndCallPayload | bytes | undefined |
| _lzTxParams | IRouter.lzTxObj | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

### redeemLocal

```solidity
function redeemLocal(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLP, bytes _to, IRouter.lzTxObj _lzTxParams) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _dstChainId | uint16 | undefined |
| _srcPoolId | uint256 | undefined |
| _dstPoolId | uint256 | undefined |
| _refundAddress | address payable | undefined |
| _amountLP | uint256 | undefined |
| _to | bytes | undefined |
| _lzTxParams | IRouter.lzTxObj | undefined |

### redeemRemote

```solidity
function redeemRemote(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLP, uint256 _minAmountLD, bytes _to, IRouter.lzTxObj _lzTxParams) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _dstChainId | uint16 | undefined |
| _srcPoolId | uint256 | undefined |
| _dstPoolId | uint256 | undefined |
| _refundAddress | address payable | undefined |
| _amountLP | uint256 | undefined |
| _minAmountLD | uint256 | undefined |
| _to | bytes | undefined |
| _lzTxParams | IRouter.lzTxObj | undefined |

### sendCredits

```solidity
function sendCredits(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _dstChainId | uint16 | undefined |
| _srcPoolId | uint256 | undefined |
| _dstPoolId | uint256 | undefined |
| _refundAddress | address payable | undefined |

### swap

```solidity
function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, IRouter.lzTxObj _lzTxParams, bytes _to, bytes _payload) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _dstChainId | uint16 | undefined |
| _srcPoolId | uint256 | undefined |
| _dstPoolId | uint256 | undefined |
| _refundAddress | address payable | undefined |
| _amountLD | uint256 | undefined |
| _minAmountLD | uint256 | undefined |
| _lzTxParams | IRouter.lzTxObj | undefined |
| _to | bytes | undefined |
| _payload | bytes | undefined |




