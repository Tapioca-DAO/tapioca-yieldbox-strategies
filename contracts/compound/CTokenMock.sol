// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import '../../tapioca-mocks/contracts/ERC20Mock.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract CTokenMock is ERC20Mock {
    using SafeERC20 for IERC20;

    address public underlying;

    constructor(
        address _underlying
    ) ERC20Mock('CTokenMock', 'CTM', 100_000 * 1e18, 18, msg.sender) {
        underlying = _underlying;
    }

    function exchangeRateStored() external pure returns (uint256) {
        return 1e18;
    }

    function mint() external payable {
        freeMint(msg.value - 100);
        transfer(msg.sender, msg.value - 100);
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        payable(msg.sender).transfer(redeemTokens);
        _burn(msg.sender, redeemTokens);
        return redeemTokens;
    }
}
