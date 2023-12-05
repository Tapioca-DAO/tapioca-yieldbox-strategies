// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "../../../tapioca-mocks/contracts/ERC20Mock.sol";

contract RouterETHMock {
    address payable public stgRouter;
    address payable public lpToken;

    constructor(address payable _stgRouter, address payable _lpToken) {
        stgRouter = _stgRouter;
        lpToken = _lpToken;
    }

    function poolId() external pure returns (uint256) {
        return 1;
    }

    function stargateRouter() external view returns (address) {
        return stgRouter;
    }

    function addLiquidityETH() external payable {
        ERC20Mock(lpToken).freeMint(msg.value);
        ERC20Mock(lpToken).transfer(msg.sender, msg.value - 1);
    }

    receive() external payable {}
}
