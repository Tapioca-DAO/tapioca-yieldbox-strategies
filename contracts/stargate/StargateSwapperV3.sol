// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

import 'tapioca-periph/contracts/Swapper/libraries/OracleLibrary.sol';

/*

__/\\\\\\\\\\\\\\\_____/\\\\\\\\\_____/\\\\\\\\\\\\\____/\\\\\\\\\\\_______/\\\\\_____________/\\\\\\\\\_____/\\\\\\\\\____        
 _\///////\\\/////____/\\\\\\\\\\\\\__\/\\\/////////\\\_\/////\\\///______/\\\///\\\________/\\\////////____/\\\\\\\\\\\\\__       
  _______\/\\\________/\\\/////////\\\_\/\\\_______\/\\\_____\/\\\_______/\\\/__\///\\\____/\\\/____________/\\\/////////\\\_      
   _______\/\\\_______\/\\\_______\/\\\_\/\\\\\\\\\\\\\/______\/\\\______/\\\______\//\\\__/\\\_____________\/\\\_______\/\\\_     
    _______\/\\\_______\/\\\\\\\\\\\\\\\_\/\\\/////////________\/\\\_____\/\\\_______\/\\\_\/\\\_____________\/\\\\\\\\\\\\\\\_    
     _______\/\\\_______\/\\\/////////\\\_\/\\\_________________\/\\\_____\//\\\______/\\\__\//\\\____________\/\\\/////////\\\_   
      _______\/\\\_______\/\\\_______\/\\\_\/\\\_________________\/\\\______\///\\\__/\\\_____\///\\\__________\/\\\_______\/\\\_  
       _______\/\\\_______\/\\\_______\/\\\_\/\\\______________/\\\\\\\\\\\____\///\\\\\/________\////\\\\\\\\\_\/\\\_______\/\\\_ 
        _______\///________\///________\///__\///______________\///////////_______\/////_____________\/////////__\///________\///__
*/

/// @title UniswapV3 swapper contract
contract StargateSwapperV3 {
    // ************ //
    // *** VARS *** //
    // ************ //
    address public owner;
    ISwapRouter public immutable swapRouter;
    uint24 public poolFee = 3000;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event PoolFee(uint256 _old, uint256 _new);

    constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
        owner = msg.sender;
    }

    /// @notice sets a new pool fee
    /// @param _newFee the new value
    function setPoolFee(uint24 _newFee) external {
        require(msg.sender == owner, 'StargateSwapperV3: unauthorized');
        emit PoolFee(poolFee, _newFee);
        poolFee = _newFee;
    }

    /// @notice queries amount out for token in amount
    /// @param amountIn the amount to query for
    /// @param tokenIn token to calculate for
    /// @param tokenOut token to be swapped with
    /// @param pool the UniswapV3 pool address
    function queryAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        address pool,
        bytes memory
    ) external view returns (uint256 amountOut) {
        (int24 tick, ) = OracleLibrary.consult(pool, 60);

        amountOut = OracleLibrary.getQuoteAtTick(
            tick,
            uint128(amountIn),
            tokenIn,
            tokenOut
        );
    }

    /// @notice swaps tokenIn to tokenOut
    /// @param amountIn the swap amount
    /// @param tokenIn swapped token
    /// @param tokenOut token to be swapped with
    /// @param deadline the unix time after which a swap will fail, to protect against long-pending transactions and wild swings in prices
    /// @param amountOutMin the minimum amount to be received from the swap operation
    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        uint256 deadline,
        uint256 amountOutMin,
        bytes memory
    ) external returns (uint256 amountOut) {
        TransferHelper.safeTransferFrom(
            tokenIn,
            msg.sender,
            address(this),
            amountIn
        );

        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
    }

    receive() external payable {}
}
