// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IComptroller {
    function isComptroller() external view returns (bool);

    function getCompAddress() external view returns (address);

    function compReceivable(address user) external view returns (uint256);

    function claimComp(address holder) external;
}
