// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

import './IBalancerVault.sol';
import './IBalancerPool.sol';

import '../mocks/ERC20Mock.sol';

contract BalancerVaultMock {
    using BoringERC20 for IERC20;

    address public stablePool; //lp token
    address public weth;

    constructor(address _stablePool, address _weth) {
        stablePool = _stablePool;
        weth = _weth;
    }

    function joinPool(
        bytes32,
        address sender,
        address recipient,
        IBalancerVault.JoinPoolRequest memory request
    ) external payable {
        IERC20(address(request.assets[1])).safeTransferFrom(
            sender,
            address(this),
            request.maxAmountsIn[1]
        );

        ERC20Mock(stablePool).freeMint(request.maxAmountsIn[1]);
        IERC20(stablePool).safeTransfer(recipient, request.maxAmountsIn[1]);
    }

    function exitPool(
        bytes32,
        address sender,
        address payable recipient,
        IBalancerVault.ExitPoolRequest memory request
    ) external {
        IERC20(stablePool).safeTransferFrom(
            sender,
            address(this),
            request.minAmountsOut[1]
        );
        IERC20(address(request.assets[1])).safeTransfer(
            recipient,
            request.minAmountsOut[1]
        );
    }

    function getPool(bytes32)
        external
        view
        returns (address, IBalancerVault.PoolSpecialization)
    {
        return (stablePool, IBalancerVault.PoolSpecialization.GENERAL);
    }

    function getPoolTokens(bytes32)
        external
        view
        returns (
            address[] memory tokens,
            uint256[] memory balances,
            uint256 lastChangeBlock
        )
    {
        tokens = new address[](2);
        tokens[1] = weth;
        balances = new uint256[](2);
        lastChangeBlock = 0;
    }

    receive() external payable {}
}
