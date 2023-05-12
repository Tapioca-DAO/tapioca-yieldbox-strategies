// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface ILPStaking {
    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function emergencyWithdraw(uint256 _pid) external;

    function pendingStargate(
        uint256 _pid,
        address _user
    ) external view returns (uint256);

    function poolLength() external view returns (uint256);

    function updatePool(uint256 _pid) external;

    function poolInfo(
        uint256 _index
    )
        external
        view
        returns (
            address lpToken,
            uint256 allocPoint,
            uint256 lastRewardBlock,
            uint256 accStargatePerShare
        );

    function userInfo(
        uint256 _pid,
        address _user
    ) external view returns (uint256 amount, uint256 rewardDebt);

    function stargate() external view returns (address);

    function stargatePerBlock() external view returns (uint256);

    function setStargatePerBlock(uint256 _stargatePerBlock) external;

    function owner() external view returns (address);
}
