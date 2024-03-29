// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";

interface IWETHToken is IERC20 {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);

    function withdraw(uint256) external;
}
