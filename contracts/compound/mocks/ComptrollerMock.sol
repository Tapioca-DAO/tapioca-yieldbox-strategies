// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ComptrollerMock is ERC20Mock {
    using SafeERC20 for IERC20;

    constructor()
        ERC20Mock("CompTokenMock", "CTM", 100_000 * 1e18, 18, msg.sender)
    {}

    function isComptroller() external pure returns (bool) {
        return true;
    }

    function getCompAddress() external view returns (address) {
        return address(this);
    }

    function compReceivable(address) external pure returns (uint256) {
        return 1e18;
    }

    function claimComp(address holder) external {
        freeMint(1e18);
        transfer(holder, 1e18);
    }
}
