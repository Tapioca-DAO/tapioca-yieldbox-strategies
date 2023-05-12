// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// solhint-disable var-name-mixedcase
// solhint-disable func-name-mixedcase

import "../../../tapioca-mocks/contracts/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TricryptoLiquidityPoolMock {
    using SafeERC20 for IERC20;

    ERC20Mock public token;
    address public weth;

    constructor(address _weth) {
        weth = _weth;
        token = new ERC20Mock(
            "InputTokenMock",
            "ITM",
            10_000 * 1e18,
            18,
            address(this)
        );
        bool hasMintRestrictions = token.hasMintRestrictions();
        if (hasMintRestrictions) {
            token.toggleRestrictions();
        }
    }

    function add_liquidity(uint256[3] calldata amounts, uint256) external {
        IERC20(weth).safeTransferFrom(msg.sender, address(this), amounts[2]); //WETH

        token.freeMint(amounts[2]);
        token.transfer(msg.sender, amounts[2]);
    }

    function remove_liquidity_one_coin(
        uint256 _token_amount,
        uint256,
        uint256
    ) external {
        token.transferFrom(msg.sender, address(this), _token_amount);
        IERC20(weth).safeTransfer(msg.sender, _token_amount);
    }

    function calc_withdraw_one_coin(
        uint256 token_amount,
        uint256
    ) external pure returns (uint256) {
        return token_amount;
    }

    function calc_token_amount(
        uint256[3] calldata amounts,
        bool
    ) external pure returns (uint256) {
        return amounts[2];
    }
}
