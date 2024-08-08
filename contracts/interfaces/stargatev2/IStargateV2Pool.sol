// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

interface IStargateV2Pool {
    function lpToken() external view returns (address);
    
    function deposit(
        address _receiver,
        uint256 _amountLD
    ) external payable returns (uint256 amountLD);

    function redeem(uint256 _amountLD, address _receiver) external returns (uint256 amountLD);
}