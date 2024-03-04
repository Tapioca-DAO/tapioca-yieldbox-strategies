// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
████████╗ █████╗ ██████╗ ██╗ ██████╗  ██████╗ █████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██╔═══██╗██╔════╝██╔══██╗
   ██║   ███████║██████╔╝██║██║   ██║██║     ███████║
   ██║   ██╔══██║██╔═══╝ ██║██║   ██║██║     ██╔══██║
   ██║   ██║  ██║██║     ██║╚██████╔╝╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
*/

contract ToftMock is ERC20 {
    address public erc20;

    constructor(address erc20_, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        erc20 = erc20_;
    }

    function wrap(address from, address to, uint256 amount) external payable returns (uint256 minted) {
        IERC20(erc20).transferFrom(from, address(this), amount);
        _mint(to, amount);
    }

    function unwrap(address to, uint256 amount) external {
        _burn(msg.sender, amount);
        IERC20(erc20).transfer(to, amount);
    }
}
