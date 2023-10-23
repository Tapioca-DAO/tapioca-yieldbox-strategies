// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CurveMinterMock {
    using SafeERC20 for IERC20;

    ERC20Mock public token;

    constructor(address payable _token) {
        token = ERC20Mock(_token);
    }

    function mint(address) external {
        token.freeMint(10 * 1e18);
        token.transfer(msg.sender, 10 * 1e18);
    }
}
