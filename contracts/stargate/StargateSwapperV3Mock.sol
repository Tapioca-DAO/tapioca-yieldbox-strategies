// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

import '../mocks/ERC20Mock.sol';

contract StargateSwapperV3Mock {
    using BoringERC20 for IERC20;

    event PoolFee(uint256 _old, uint256 _new);

    constructor() {}

    function queryAmountOut(
        uint256 amountIn,
        address,
        address,
        address,
        bytes memory
    ) external pure returns (uint256) {
        return amountIn;
    }

    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        uint256,
        uint256,
        bytes memory
    ) external returns (uint256) {
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        ERC20Mock(tokenOut).freeMint(amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountIn);
        return amountIn;
    }
}
