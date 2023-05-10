// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface ICToken {
    function mint() external payable;

    function redeem(uint256 redeemTokens) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function decimals() external view returns (uint256);

    function underlying() external view returns (address);

    function accrueInterest() external returns (uint256);
}
