// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

contract StargateV2RewarderMock {
    address[] public tokens;
    uint256[] public amounts;
    
    function connect(address) external pure {}

    function setRewards(address[] memory _tokens, uint256[] memory _amounts) external {
        tokens = _tokens;
        amounts = _amounts;
    }
    function getRewards(address, address) external view returns (address[] memory, uint256[] memory) {
        address[] memory _tokens = tokens;
        uint256[] memory _amounts = amounts;
        return (_tokens, _amounts);
    }
}