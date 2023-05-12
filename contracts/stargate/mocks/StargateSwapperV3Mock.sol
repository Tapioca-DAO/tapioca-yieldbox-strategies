// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StargateSwapperV3Mock {
    using SafeERC20 for IERC20;

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
        ERC20Mock(payable(tokenOut)).freeMint(amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountIn);
        return amountIn;
    }
}
