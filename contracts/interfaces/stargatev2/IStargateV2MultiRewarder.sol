// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

interface IStargateV2MultiRewarder {
    function getRewards(address stakingToken, address user) external view returns (address[] memory, uint256[] memory);
}