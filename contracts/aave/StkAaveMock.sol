// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// solhint-disable func-name-mixedcase

contract StkAaveMock is ERC20Mock {
    using SafeERC20 for IERC20;

    ERC20Mock public token;

    uint256 public lastCooldown;

    constructor()
        ERC20Mock("StkAaveMock", "STKM", 100_000 * 1e18, 18, msg.sender)
    {
        token = new ERC20Mock(
            "InputTokenMock",
            "ITM",
            10_000 * 1e18,
            18,
            msg.sender
        );
    }

    function REWARD_TOKEN() external view returns (address) {
        return address(token);
    }

    function cooldown() external {
        lastCooldown = block.timestamp;
    }

    function stakerRewardsToClaim(address) public view returns (uint256) {
        if (lastCooldown + 12 days < block.timestamp) return 0;
        return 100 * 1e18;
    }

    function stakersCooldowns(address) external view returns (uint256) {
        return lastCooldown;
    }

    function claimRewards(address to, uint256 amount) external {
        amount = stakerRewardsToClaim(address(0));
        token.freeMint(amount);
        token.transfer(to, amount);
    }
}
