// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

import '../mocks/ERC20Mock.sol';

contract CTokenMock is ERC20Mock {
    using BoringERC20 for IERC20;

    address public underlying;

    constructor(address _underlying) ERC20Mock(100_000 * 1e18) {
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

    receive() external payable {}
}
