// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IStkAave {
    struct CooldownSnapshot {
        uint40 timestamp;
        uint216 amount;
    }

    function REWARD_TOKEN() external view returns (address);

    function stake(address to, uint256 amount) external;

    function redeem(address to, uint256 amount) external;

    function cooldown() external;

    function claimRewards(address to, uint256 amount) external;

    function stakerRewardsToClaim(
        address _user
    ) external view returns (uint256);

    function stakersCooldowns(
        address _user
    ) external view returns (uint40, uint216);

    function balanceOf(address _user) external view returns (uint256);

    function getTotalRewardsBalance(
        address staker
    ) external view returns (uint256);

    function COOLDOWN_SECONDS() external view returns (uint256);

    function UNSTAKE_WINDOW() external view returns (uint256);
}
