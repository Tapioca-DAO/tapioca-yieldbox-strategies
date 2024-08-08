// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

// Tapioca
import {IZeroXSwapper} from "tap-utils/interfaces/periph/IZeroXSwapper.sol";
import {ICluster} from "tap-utils/interfaces/periph/ICluster.sol";


abstract contract Events {
    // **************************** //
    // *** STARGATE V2 STRATEGY *** //
    // **************************** //
    event AmountDeposited(uint256 amount);
    event AmountWithdrawn(address indexed to, uint256 amount);
    event ClusterUpdated(ICluster indexed oldCluster, ICluster indexed newCluster);
    event SwapperUpdated(IZeroXSwapper indexed oldCluster, IZeroXSwapper indexed newCluster);
    event PoolUpdated(address indexed oldAddy, address indexed newAddy);
    event FarmUpdated(address indexed oldAddy, address indexed newAddy);
    event Paused(bool prev, bool crt, bool isDepositType);
    event ArbOracleUpdated(address indexed oldAddy, address indexed newAddy);
    event StgOracleUpdated(address indexed oldAddy, address indexed newAddy);
}