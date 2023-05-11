// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import '../../tapioca-mocks/contracts/ERC20Mock.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

// solhint-disable func-name-mixedcase

contract IncentivesControllerMock {
    using SafeERC20 for IERC20;

    ERC20Mock public token;

    constructor(address payable _token) {
        //StkAaveMock
        token = ERC20Mock(_token);
    }

    function REWARD_TOKEN() external view returns (address) {
        return address(token);
    }

    function getUserUnclaimedRewards(address) external pure returns (uint256) {
        return 100 * 10 ** 18;
    }

    function claimRewards(
        address[] calldata,
        uint256,
        address to
    ) external returns (uint256) {
        token.freeMint(100 * 10 ** 18);
        token.transfer(to, 100 * 10 ** 18);
        return 100 * 10 ** 18;
    }

    function getRewardsBalance(
        address[] calldata,
        address
    ) external pure returns (uint256) {
        return 100 * 10 ** 18;
    }
}
