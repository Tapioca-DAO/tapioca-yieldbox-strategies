// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StargateRouterMock {
    using SafeERC20 for IERC20;

    IERC20 public stgToken;

    constructor(address _stgToken) {
        stgToken = IERC20(_stgToken);
    }

    function instantRedeemLocal(
        uint16,
        uint256 _amountLP,
        address _to
    ) external returns (uint256) {
        stgToken.safeTransferFrom(msg.sender, address(this), _amountLP);
        safeTransferETH(_to, _amountLP); //we assume contract has eth
        return _amountLP;
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "StargateStrategy: ETH transfer failed");
    }

    receive() external payable {}
}
