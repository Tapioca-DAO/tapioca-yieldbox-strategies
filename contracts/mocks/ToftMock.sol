// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pearlmit, IPearlmit, PearlmitHash} from "tapioca-periph/pearlmit/Pearlmit.sol";

// Tapioca
import {PearlmitHandler} from "tap-utils/pearlmit/PearlmitHandler.sol";
import {IPearlmit} from "tap-utils/interfaces/periph/IPearlmit.sol";
/*
████████╗ █████╗ ██████╗ ██╗ ██████╗  ██████╗ █████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██╔═══██╗██╔════╝██╔══██╗
   ██║   ███████║██████╔╝██║██║   ██║██║     ███████║
   ██║   ██╔══██║██╔═══╝ ██║██║   ██║██║     ██╔══██║
   ██║   ██║  ██║██║     ██║╚██████╔╝╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
*/

contract ToftMock is ERC20, PearlmitHandler {
    error TOFT_NotValid();
    error TOFT_AllowanceNotValid();

    address public erc20;
    IPearlmit public pearlmit;

    error FailedToWrap();

    constructor(address erc20_, string memory name_, string memory symbol_, IPearlmit _pearlmit)
        ERC20(name_, symbol_)
        PearlmitHandler(_pearlmit)
    {
        erc20 = erc20_;
    }

    function setPearlmit(IPearlmit _pearlmit) external {
        pearlmit = _pearlmit;
    }

    function wrap(address from, address to, uint256 amount) external payable returns (uint256 minted) {
        bool isErr = pearlmit.transferFromERC20(from, address(this), erc20, amount);
        if (isErr) revert FailedToWrap();

        _mint(to, amount);
        return amount;
    }

    function unwrap(address to, uint256 amount) external returns (uint256 unwrapped) {
        _burn(msg.sender, amount);
        IERC20(erc20).transfer(to, amount);
        return amount;
    }
}
