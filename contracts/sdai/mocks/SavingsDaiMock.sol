// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/ERC20.sol";

contract SavingsDaiMock is ERC20WithSupply {
    using BoringERC20 for IERC20;

    address public dai;

    constructor(address _dai) {
        dai = _dai;
    }

    function symbol() external pure returns (string memory) {
        return "sDai";
    }

    function name() external pure returns (string memory) {
        return "sDAI token";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function maxRedeem(address) external view returns (uint256) {
        return IERC20(dai).balanceOf(address(this));
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256) {
        IERC20(dai).safeTransfer(receiver, assets);
        _burn(owner, assets);
        return assets;
    }

    function previewWithdraw(uint256 assets) external pure returns (uint256) {
        return assets;
    }

    function previewRedeem(uint256 assets) external pure returns (uint256) {
        return assets;
    }

    function deposit(
        uint256 assets,
        address receiver
    ) external returns (uint256) {
        _mint(receiver, assets);
        IERC20(dai).safeTransferFrom(msg.sender, address(this), assets);
        return assets;
    }

    function maxWithdraw(address) external view returns (uint256) {
        return totalSupply;
    }

    function convertToShares(uint256 assets) external pure returns (uint256) {
        return assets;
    }

    function redeem(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256) {
        IERC20(dai).safeTransfer(receiver, assets);
        _burn(owner, assets);
        return assets;
    }
}
