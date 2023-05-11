// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import '../../tapioca-mocks/contracts/ERC20Mock.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract SwapperMock {
    using SafeERC20 for IERC20;

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
        ERC20Mock(payable(path[1])).freeMint(amountIn);
        IERC20(path[1]).safeTransfer(to, amountIn);
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
    }
}
