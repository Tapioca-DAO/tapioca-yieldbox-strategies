// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import '../../tapioca-mocks/contracts/ERC20Mock.sol';

contract StEthMock is ERC20Mock {
    constructor(
        uint256 initialSupply
    ) ERC20Mock('StEthMock', 'STETHM', initialSupply, 18, msg.sender) {}

    function submit(address) external payable returns (uint256) {
        freeMint(msg.value);

        transfer(msg.sender, msg.value);

        return msg.value;
    }

    function isStakingPaused() external pure returns (bool) {
        return false;
    }
}
