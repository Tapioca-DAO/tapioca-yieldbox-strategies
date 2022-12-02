// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

import './IBalancerVault.sol';
import './IBalancerPool.sol';

import '../mocks/ERC20Mock.sol';

contract BalancerPoolMock is ERC20Mock {
    using BoringERC20 for IERC20;

    constructor() ERC20Mock(100_000_000 * 10**18) {}

    function getRate() external pure returns (uint256) {
        return 1e18;
    }
}
