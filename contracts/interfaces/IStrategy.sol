// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IStrategy {
    function compoundAmount() external view returns (uint256 result);

    function compound(bytes memory) external;
}
