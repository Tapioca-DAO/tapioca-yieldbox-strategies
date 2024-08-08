// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import {IPearlmit, Pearlmit} from "tap-utils/pearlmit/Pearlmit.sol";
import {Cluster} from "tap-utils/Cluster/Cluster.sol";
import {YieldBox} from "yieldbox/YieldBox.sol";

// tests
import {Utils} from "./utils/Utils.sol";

abstract contract Base_Test is Utils {
    // ************ //
    // *** VARS *** //
    // ************ //
    // users
    address public userA;
    address public userB;
    uint256 public initialBalance = LARGE_AMOUNT;

    // common general storage
    YieldBox yieldBox;
    Pearlmit pearlmit;
    Cluster cluster;

    // ************* //
    // *** SETUP *** //
    // ************* //
    function setUp() public virtual {
        // ***  *** //
        userA = _createUser(USER_A_PKEY, "User A");
        userB = _createUser(USER_B_PKEY, "User B");

        // create real Cluster
        cluster = _createCluster(address(this));
        // create real Pearlmit
        pearlmit = _createPearlmit(address(this));
        // create real YieldBox
        yieldBox = _createYieldBox(address(this), pearlmit);
    }

    // ***************** //
    // *** MODIFIERS *** //
    // ***************** //
    modifier isArbFork() {
        vm.selectFork(ARB_FORK);
        _;
    }
    modifier resetPrank(address user) {
        _resetPrank(user);
        _;
    }

    /// @notice Modifier to approve an operator in YB via Pearlmit.
    modifier whenApprovedViaPearlmit(
        address _token,
        uint256 _tokenId,
        address _from,
        address _operator,
        uint256 _amount,
        uint256 _expiration
    ) {
        _approveViaPearlmit({
            token: _token,
            pearlmit: IPearlmit(address(pearlmit)),
            from: _from,
            operator: _operator,
            amount: _amount,
            expiration: _expiration,
            tokenId: _tokenId
        });
        _;
    }

    /// @notice Modifier to approve an operator via regular ERC20.
    modifier whenApprovedViaERC20(address _token, address _from, address _operator, uint256 _amount) {
        _approveViaERC20({token: _token, from: _from, operator: _operator, amount: _amount});
        _;
    }
}
