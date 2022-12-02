// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

import './IBalancerVault.sol';
import './IBalancerPool.sol';

import '../mocks/ERC20Mock.sol';

contract BalancerHelpersMock {
    function queryJoin(
        bytes32,
        address,
        address,
        IBalancerVault.JoinPoolRequest memory
    ) external pure returns (uint256 bptOut, uint256[] memory amountsIn) {
        amountsIn = new uint256[](2);
        bptOut = 0;
    }

    function queryExit(
        bytes32,
        address,
        address,
        IBalancerVault.ExitPoolRequest memory
    ) external pure returns (uint256 bptIn, uint256[] memory amountsOut) {
        bptIn = 0;
        amountsOut = new uint256[](2);
    }
}
