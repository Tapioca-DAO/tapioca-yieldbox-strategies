// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// external
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// utils
import {Constants} from "./Constants.sol";

// tapioca
import {IWrappedNative} from "yieldbox/interfaces/IWrappedNative.sol";
import {Pearlmit, IPearlmit} from "tap-utils/pearlmit/Pearlmit.sol";
import {YieldBoxURIBuilder} from "yieldbox/YieldBoxURIBuilder.sol";
import {ZeroXSwapper} from "tap-utils/Swapper/ZeroXSwapper.sol";
import {Cluster} from "tap-utils/Cluster/Cluster.sol";
import {YieldBox} from "yieldbox/YieldBox.sol";

import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";

// test
import {OracleMock} from "tapioca-strategies/mocks/OracleMock.sol";
import {MockERC20} from "tapioca-strategies/mocks/MockERC20.sol";
import {ToftMock} from "tapioca-strategies/mocks/ToftMock.sol";
import {Test} from "forge-std/Test.sol";

abstract contract Utils is Constants, Test {
    // ************************ //
    // *** GENERAL: HELPERS *** //
    // ************************ //
    /// @dev Stops the active prank and sets a new one.
    function _resetPrank(address msgSender) internal {
        vm.stopPrank();
        vm.startPrank(msgSender);
    }

    // ********************** //
    // *** DEPLOY HELPERS *** //
    // ********************** //
    // MockERC20
    function _createToken(string memory _name) internal returns (MockERC20) {
        MockERC20 _token = new MockERC20(_name, _name);
        vm.label(address(_token), _name);
        return _token;
    }

    // Creates TOFT mock
    function _createToft(address _erc20, address _pearlmit) internal returns (ToftMock) {
        ToftMock toft = new ToftMock(_erc20, "TOFT", "TOFT", IPearlmit(_pearlmit));
        vm.label(address(toft), "TOFT");
        return toft;
    }

    // Creates user from Private key
    function _createUser(uint256 _key, string memory _name) internal returns (address) {
        address _user = vm.addr(_key);
        vm.deal(_user, LARGE_AMOUNT);
        vm.label(_user, _name);
        return _user;
    }

    // Creates real Cluster
    function _createCluster(address _owner) internal returns (Cluster) {
        Cluster cluster = new Cluster(0, _owner);
        vm.label(address(cluster), "Cluster Test");
        return cluster;
    }

    // Creates real Pearlmit
    function _createPearlmit(address _owner) internal returns (Pearlmit) {
        Pearlmit pearlmit = new Pearlmit("Pearlmit Test", "1", _owner, 0);
        vm.label(address(pearlmit), "Pearlmit Test");
        return pearlmit;
    }

    // Creates real YieldBox
    function _createYieldBox(address _owner, Pearlmit _pearlmit) internal returns (YieldBox) {
        YieldBoxURIBuilder uriBuilder = new YieldBoxURIBuilder();
        YieldBox yieldBox = new YieldBox(IWrappedNative(address(0)), uriBuilder, _pearlmit, _owner);
        return yieldBox;
    }

    // OracleMock; allows changing the current rate to simulate multiple situations
    function _createOracle(string memory _name) internal returns (OracleMock) {
        OracleMock _oracle = new OracleMock(_name, _name, DEFAULT_ORACLE_RATE);
        vm.label(address(_oracle), _name);
        return _oracle;
    }

    // Creates real 0xSwapper
    function _createSwapper(address _target, address _cluster, address _owner) internal returns (ZeroXSwapper) {
        ZeroXSwapper swapper = new ZeroXSwapper(_target, ICluster(_cluster), _owner);
        vm.label(address(swapper), "Swapper");
        return swapper;
    }

    // ************************ //
    // *** APPROVAL HELPERS *** //
    // ************************ //
    function _approveViaERC20(address token, address from, address operator, uint256 amount) internal {
        _resetPrank({msgSender: from});
        IERC20(token).approve(address(operator), amount);
    }

    function _approveViaPearlmit(
        address token,
        IPearlmit pearlmit,
        address from,
        address operator,
        uint256 amount,
        uint256 expiration,
        uint256 tokenId
    ) internal {
        // Reset prank
        _resetPrank({msgSender: from});

        // Set approvals to pearlmit
        IERC20(token).approve(address(pearlmit), amount);

        // Approve via pearlmit
        pearlmit.approve(TOKEN_TYPE_ERC20, token, tokenId, operator, uint200(amount), uint48(expiration));
    }

    function _approveYieldBoxAssetId(YieldBox yieldBox, address from, address operator, uint256 assetId) internal {
        _resetPrank({msgSender: from});
        yieldBox.setApprovalForAsset(operator, assetId, true);
    }

    function _approveYieldBoxForAll(YieldBox yieldBox, address from, address operator) internal {
        _resetPrank({msgSender: from});
        yieldBox.setApprovalForAll(operator, true);
    }
}
