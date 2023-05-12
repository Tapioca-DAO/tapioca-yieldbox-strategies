// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";

import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";

import "./interfaces/IStEth.sol";
import "./interfaces/ICurveEthStEthPool.sol";
import "../interfaces/INative.sol";

/*

__/\\\\\\\\\\\\\\\_____/\\\\\\\\\_____/\\\\\\\\\\\\\____/\\\\\\\\\\\_______/\\\\\_____________/\\\\\\\\\_____/\\\\\\\\\____        
 _\///////\\\/////____/\\\\\\\\\\\\\__\/\\\/////////\\\_\/////\\\///______/\\\///\\\________/\\\////////____/\\\\\\\\\\\\\__       
  _______\/\\\________/\\\/////////\\\_\/\\\_______\/\\\_____\/\\\_______/\\\/__\///\\\____/\\\/____________/\\\/////////\\\_      
   _______\/\\\_______\/\\\_______\/\\\_\/\\\\\\\\\\\\\/______\/\\\______/\\\______\//\\\__/\\\_____________\/\\\_______\/\\\_     
    _______\/\\\_______\/\\\\\\\\\\\\\\\_\/\\\/////////________\/\\\_____\/\\\_______\/\\\_\/\\\_____________\/\\\\\\\\\\\\\\\_    
     _______\/\\\_______\/\\\/////////\\\_\/\\\_________________\/\\\_____\//\\\______/\\\__\//\\\____________\/\\\/////////\\\_   
      _______\/\\\_______\/\\\_______\/\\\_\/\\\_________________\/\\\______\///\\\__/\\\_____\///\\\__________\/\\\_______\/\\\_  
       _______\/\\\_______\/\\\_______\/\\\_\/\\\______________/\\\\\\\\\\\____\///\\\\\/________\////\\\\\\\\\_\/\\\_______\/\\\_ 
        _______\///________\///________\///__\///______________\///////////_______\/////_____________\/////////__\///________\///__
*/

//TODO: update withdrawal and currentBalance after Lido allows withdrawals
contract LidoEthStrategy is BaseERC20Strategy, BoringOwnable, ReentrancyGuard {
    using BoringERC20 for IERC20;

    // ************ //
    // *** VARS *** //
    // ************ //
    IERC20 public immutable wrappedNative;
    IStEth public immutable stEth;
    ICurveEthStEthPool public curveStEthPool;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation to AAVE is performed
    uint256 public depositThreshold;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event DepositThreshold(uint256 _old, uint256 _new);
    event AmountQueued(uint256 amount);
    event AmountDeposited(uint256 amount);
    event AmountWithdrawn(address indexed to, uint256 amount);

    constructor(
        IYieldBox _yieldBox,
        address _token,
        address _stEth,
        address _curvePool
    ) BaseERC20Strategy(_yieldBox, _token) {
        wrappedNative = IERC20(_token);
        stEth = IStEth(_stEth);
        curveStEthPool = ICurveEthStEthPool(_curvePool);

        IERC20(_stEth).approve(_curvePool, type(uint256).max);
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "Lido-ETH";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "Lido-ETH strategy for wrapped native assets";
    }

    /// @notice returns compounded amounts in wrappedNative
    function compoundAmount() public pure returns (uint256 result) {
        return 0;
    }

    // *********************** //
    // *** OWNER FUNCTIONS *** //
    // *********************** //
    /// @notice Sets the deposit threshold
    /// @param amount The new threshold amount
    function setDepositThreshold(uint256 amount) external onlyOwner {
        emit DepositThreshold(depositThreshold, amount);
        depositThreshold = amount;
    }

    // ************************ //
    // *** PUBLIC FUNCTIONS *** //
    // ************************ //
    function compound(bytes memory) public {}

    /// @notice withdraws everythig from the strategy
    function emergencyWithdraw() external onlyOwner returns (uint256 result) {
        compound("");

        uint256 toWithdraw = stEth.balanceOf(address(this));
        uint256 minAmount = (toWithdraw * 50) / 10_000; //0.5%
        result = curveStEthPool.exchange(1, 0, toWithdraw, minAmount);

        INative(address(wrappedNative)).deposit{value: result}();
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //
    /// @dev queries Lido and Curve Eth/STEth pools
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 stEthBalance = stEth.balanceOf(address(this));
        uint256 calcEth = stEthBalance > 0
            ? curveStEthPool.get_dy(1, 0, stEthBalance)
            : 0;
        uint256 queued = wrappedNative.balanceOf(address(this));
        return calcEth + queued;
    }

    /// @dev deposits to Lido or queues tokens if the 'depositThreshold' has not been met yet
    function _deposited(uint256 amount) internal override nonReentrant {
        uint256 queued = wrappedNative.balanceOf(address(this));
        if (queued > depositThreshold) {
            require(!stEth.isStakingPaused(), "LidoStrategy: staking paused");
            INative(address(wrappedNative)).withdraw(queued);
            stEth.submit{value: queued}(address(0)); //1:1 between eth<>stEth
            emit AmountDeposited(queued);
            return;
        }
        emit AmountQueued(amount);
    }

    /// @dev swaps StEth with Eth
    function _withdraw(
        address to,
        uint256 amount
    ) internal override nonReentrant {
        uint256 available = _currentBalance();
        require(available >= amount, "LidoStrategy: amount not valid");

        uint256 queued = wrappedNative.balanceOf(address(this));
        if (amount > queued) {
            uint256 toWithdraw = amount - queued; //1:1 between eth<>stEth
            uint256 minAmount = toWithdraw - (toWithdraw * 250) / 10_000; //2.5%
            uint256 obtainedEth = curveStEthPool.exchange(
                1,
                0,
                toWithdraw,
                minAmount
            );

            INative(address(wrappedNative)).deposit{value: obtainedEth}();
        }
        queued = wrappedNative.balanceOf(address(this));
        require(queued >= amount, "LidoStrategy: not enough");

        wrappedNative.safeTransfer(to, amount);

        emit AmountWithdrawn(to, amount);
    }

    receive() external payable {}
}
