// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../interfaces/IConvexZap.sol";
import "../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ConvexZapMock is IConvexZap {
    using SafeERC20 for IERC20;

    address payable public reward1;
    address payable public reward2;

    constructor(address payable _reward1, address payable _reward2) {
        reward1 = _reward1;
        reward2 = _reward2;
    }

    function claimRewards(
        address[] memory,
        address[] memory,
        address[] memory,
        address[] memory,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) public override {
        ERC20Mock(reward1).freeMint(10 ** 19);
        ERC20Mock(reward2).freeMint(10 ** 19);

        IERC20(reward1).safeTransfer(msg.sender, 10 ** 19);
        IERC20(reward2).safeTransfer(msg.sender, 10 ** 19);
    }

    function cvx() external pure override returns (address) {
        return address(0);
    }

    function cvxRewards() external pure override returns (address) {
        return address(0);
    }
}
