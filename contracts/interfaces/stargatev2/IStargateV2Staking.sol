// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

interface IStargateV2Staking {
    function balanceOf(address token, address user) external view returns (uint256);
    function rewarder(address token) external view returns (address);
    function deposit(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external;
    function claim(address[] calldata lpTokens) external;
}