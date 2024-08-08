// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

/// @notice Helper contract containing constants for testing.
abstract contract Constants {
    // *************** //
    // *** GENERIC *** //
    // *************** //
    uint256 public constant SMALL_AMOUNT = 1 ether;
    uint256 public constant MEDIUM_AMOUNT = 10 ether;
    uint256 public constant LARGE_AMOUNT = 100 ether;

    uint256 public constant LOW_DECIMALS_SMALL_AMOUNT = 1_000_000;
    uint256 public constant LOW_DECIMALS_MEDIUM_AMOUNT = 10_000_000;
    uint256 public constant LOW_DECIMALS_LARGE_AMOUNT = 100_000_000;

    uint256 public constant LOW_DECIMALS = 6;
    uint256 public constant DEFAULT_DECIMALS = 18;

    uint256 public constant USER_A_PKEY = 0x1;
    uint256 public constant USER_B_PKEY = 0x2;

    address public constant ADDRESS_ZERO = address(0);
    uint256 public constant VALUE_ZERO = 0;

    uint256 public constant DEFAULT_ORACLE_RATE = 1 ether;
    uint256 public constant FUTURE_TIMESTAMP = 1999999999; // 2033
    uint256 public constant STG_USDC_RATE = 10000000 * 1e10; //0.1
    uint256 public constant ARB_USDC_RATE = 10000000 * 1e10 ; //0.1

    // **************** //
    // *** PEARLMIT *** //
    // **************** //
    /// @dev Constant value representing the ERC721 token type for signatures and transfer hooks
    uint256 constant TOKEN_TYPE_ERC721 = 721;
    /// @dev Constant value representing the ERC1155 token type for signatures and transfer hooks
    uint256 constant TOKEN_TYPE_ERC1155 = 1155;
    /// @dev Constant value representing the ERC20 token type for signatures and transfer hooks
    uint256 constant TOKEN_TYPE_ERC20 = 20;

    // ********************* //
    // *** ENV VARIABLES *** //
    // ********************* //
    string constant ENV_BINANCE_WALLET_ADDRESS = "BINANCE_WALLET_ADDRESS";
    string constant ENV_POOL_ADDRESS = "STARGATEV2_POOL";
    string constant ENV_FARM_ADDRESS = "STARGATEV2_FARM";
    string constant ENV_USDC = "USDC";
    string constant ENV_WETH = "WETH";
    string constant RPC_URL = "ARBITRUM_RPC_URL";
    string constant FORKING_BLOCK_NUMBER = "FORKING_BLOCK_NUMBER";
    uint256 ARB_FORK;


}
