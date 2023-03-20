// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol';
import '@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol';

interface IBalancerPool is IERC20 {
    function getRate() external view returns (uint256);

    function balanceOf(address _user) external view returns (uint256);
}
