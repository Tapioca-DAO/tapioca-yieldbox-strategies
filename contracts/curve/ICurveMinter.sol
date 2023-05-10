// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface ICurveMinter {
    // solhint-disable-next-line var-name-mixedcase
    function mint(address _gauge_addr) external;
}
