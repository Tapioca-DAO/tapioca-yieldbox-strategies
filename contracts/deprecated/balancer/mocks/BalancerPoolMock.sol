// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "../interfaces/IBalancerVault.sol";
import "../interfaces/IBalancerPool.sol";

import "../../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BalancerPoolMock is ERC20Mock {
    using SafeERC20 for IERC20;

    constructor()
        ERC20Mock("BalancePoolMock", "BLPM", 100_000_000 * 1e18, 18, msg.sender)
    {}

    function getRate() external pure returns (uint256) {
        return 1e18;
    }
}
