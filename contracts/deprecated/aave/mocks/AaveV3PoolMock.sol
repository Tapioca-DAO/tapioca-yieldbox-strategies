// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AaveV3PoolMock {
    using SafeERC20 for IERC20;

    IERC20 public asset;
    ERC20Mock public aAsset;

    constructor(address _asset) {
        asset = IERC20(_asset);
        aAsset = new ERC20Mock("aAsset Name", "aAsset", 0, 18, address(this));
    }

    function supply(address, uint256 amount, address, uint16) external {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        aAsset.mintTo(msg.sender, amount);
    }

    function withdraw(
        address,
        uint256 amount,
        address to
    ) external returns (uint256) {
        uint256 extraAmount = (amount * 1_000) / 10_000; //simulate rewards
        asset.safeTransfer(to, amount + extraAmount);
        IERC20(address(aAsset)).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        return amount + extraAmount;
    }
}
