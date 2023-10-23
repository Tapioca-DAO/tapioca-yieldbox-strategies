// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IConvexZap {
    function claimRewards(
        address[] calldata rewardContracts,
        address[] calldata extraRewardContracts,
        address[] calldata tokenRewardContracts,
        address[] calldata tokenRewardTokens,
        uint256 depositCrvMaxAmount,
        uint256 minAmountOut,
        uint256 depositCvxMaxAmount,
        uint256 spendCvxAmount,
        uint256 options
    ) external;

    function cvxRewards() external view returns (address);

    function cvx() external view returns (address);
}
