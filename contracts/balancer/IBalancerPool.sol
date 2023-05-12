// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IBalancerPool {
    function getRate() external view returns (uint256);

    function balanceOf(address _user) external view returns (uint256);
}
