// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CTokenMock is ERC20Mock {
    using SafeERC20 for IERC20;

    address public underlying;
    address public comptrollerAddr;

    constructor(
        address _underlying,
        address _comptroller
    ) ERC20Mock("CTokenMock", "CTM", 100_000 * 1e18, 18, msg.sender) {
        underlying = _underlying;
        comptrollerAddr = _comptroller;
    }

    function exchangeRateStored() external pure returns (uint256) {
        return 1e18;
    }

    function accrualBlockNumber() external view returns (uint256) {
        return block.number;
    }

    function getCash() external pure returns (uint256) {
        return 1;
    }

    function totalBorrows() external pure returns (uint256) {
        return 1;
    }

    function totalReserves() external pure returns (uint256) {
        return 1;
    }

    function borrowRatePerBlock() external pure returns (uint256) {
        return 1;
    }

    function reserveFactorMantissa() external pure returns (uint256) {
        return 1;
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

    function redeemUnderlying(uint256 redeemTokens) external returns (uint256) {
        payable(msg.sender).transfer(redeemTokens);
        _burn(msg.sender, redeemTokens);
        return redeemTokens;
    }

    function comptroller() external view returns (address) {
        return comptrollerAddr;
    }
}
