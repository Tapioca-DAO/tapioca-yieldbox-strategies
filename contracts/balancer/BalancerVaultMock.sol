// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./IBalancerVault.sol";
import "./IBalancerPool.sol";
import "../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BalancerVaultMock {
    using SafeERC20 for IERC20;

    address payable public stablePool; //lp token
    address public weth;

    constructor(address payable _stablePool, address _weth) {
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

    function getPool(
        bytes32
    ) external view returns (address, IBalancerVault.PoolSpecialization) {
        return (stablePool, IBalancerVault.PoolSpecialization.GENERAL);
    }

    function getPoolTokens(
        bytes32
    )
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
