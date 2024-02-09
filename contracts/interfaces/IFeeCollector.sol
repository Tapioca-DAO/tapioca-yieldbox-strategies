// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

interface IFeeCollector {
    function feeRecipient() external view returns (address);

    function withdrawFees() external;
}
