// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IStargateSwapper {
    /// @notice queries amount out for token in amount
    /// @param amountIn the amount to query for
    /// @param tokenIn token to calculate for
    /// @param tokenOut token to be swapped with
    /// @param pool the UniswapV3 pool address
    /// @param data extra data
    function queryAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        address pool,
        bytes memory data
    ) external view returns (uint256 amountOut);

    /// @notice swaps tokenIn to tokenOut
    /// @param amountIn the swap amount
    /// @param tokenIn swapped token
    /// @param tokenOut token to be swapped with
    /// @param deadline the unix time after which a swap will fail, to protect against long-pending transactions and wild swings in prices
    /// @param amountOutMin the minimum amount to be received from the swap operation
    /// @param data extra data
    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        uint256 deadline,
        uint256 amountOutMin,
        bytes memory data
    ) external returns (uint256 amountOut);
}
