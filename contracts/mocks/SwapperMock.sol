// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

import '../mocks/ERC20Mock.sol';

contract SwapperMock {
    using BoringERC20 for IERC20;

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata
    ) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        ERC20Mock(path[1]).freeMint(amountIn);
        IERC20(path[1]).safeTransfer(to, amountIn);
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
    }
}
