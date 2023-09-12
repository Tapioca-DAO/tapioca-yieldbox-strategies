// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";

import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";

import "../../tapioca-periph/contracts/interfaces/INative.sol";
import "../../tapioca-periph/contracts/interfaces/ISwapper.sol";
import "./interfaces/ICToken.sol";
import "./interfaces/IComptroller.sol";
import "./libraries/LibCompound.sol";

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

contract CompoundStrategy is BaseERC20Strategy, BoringOwnable, ReentrancyGuard {
    using BoringERC20 for IERC20;

    // ************ //
    // *** VARS *** //
    // ************ //
    IERC20 public immutable wrappedNative;

    ICToken public immutable cToken;
    IComptroller public comptroller;

    ISwapper public swapper;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation to Yearn is performed
    uint256 public depositThreshold;

    bool public paused;

    uint256 private _slippage = 50;
    bytes public defaultSwapData;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event MultiSwapper(address indexed _old, address indexed _new);
    event DepositThreshold(uint256 _old, uint256 _new);
    event AmountQueued(uint256 amount);
    event AmountDeposited(uint256 amount);
    event AmountWithdrawn(address indexed to, uint256 amount);
    event ComptrollerUpdated(address indexed _old, address _new);

    constructor(
        IYieldBox _yieldBox,
        address _token,
        address _cToken,
        address _multiSwapper
    ) BaseERC20Strategy(_yieldBox, _token) {
        wrappedNative = IERC20(_token);
        swapper = ISwapper(_multiSwapper);

        cToken = ICToken(_cToken);
        comptroller = IComptroller(cToken.comptroller());

        wrappedNative.approve(_cToken, 0);
        wrappedNative.approve(_cToken, type(uint256).max);
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "Compound";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "Compound strategy for wrapped native assets";
    }

    /// @notice returns compounded amounts in wrappedNative
    function compoundAmount() external view returns (uint256 result) {
        uint256 claimable = comptroller.compReceivable(address(this));
        result = 0;
        if (claimable > 0) {
            ISwapper.SwapData memory swapData = swapper.buildSwapData(
                comptroller.getCompAddress(),
                address(wrappedNative),
                claimable,
                0,
                false,
                false
            );
            result = swapper.getOutputAmount(swapData, defaultSwapData);
            result = result - (result * _slippage) / 10_000; //0.5%
        }

        return 0;
    }

    // *********************** //
    // *** OWNER FUNCTIONS *** //
    // *********************** //
    /// @notice updates the pause state
    /// @param _val the new state
    function updatePaused(bool _val) external onlyOwner {
        paused = _val;
    }

    /// @notice sets the default swap data
    /// @param _data the new data
    function setDefaultSwapData(bytes calldata _data) external onlyOwner {
        defaultSwapData = _data;
    }

    /// @notice sets the slippage used in swap operations
    /// @param _val the new slippage amount
    function setSlippage(uint256 _val) external onlyOwner {
        _slippage = _val;
    }

    /// @notice Sets the Swapper address
    /// @param _swapper The new swapper address
    function setMultiSwapper(address _swapper) external onlyOwner {
        emit MultiSwapper(address(swapper), _swapper);
        swapper = ISwapper(_swapper);
    }

    /// @notice updates `comptroller` state variable
    function checkUpdateComptroller() external onlyOwner {
        address newComptroller = cToken.comptroller();
        if (newComptroller != address(comptroller)) {
            emit ComptrollerUpdated(address(comptroller), newComptroller);
            comptroller = IComptroller(newComptroller);
        }
    }

    /// @notice rescues unused ETH from the contract
    /// @param amount the amount to rescue
    /// @param to the recipient
    function rescueEth(uint256 amount, address to) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        require(success, "CompoundStrategy: transfer failed.");
    }

    /// @notice Sets the deposit threshold
    /// @param amount The new threshold amount
    function setDepositThreshold(uint256 amount) external onlyOwner {
        emit DepositThreshold(depositThreshold, amount);
        depositThreshold = amount;
    }

    // ************************ //
    // *** PUBLIC FUNCTIONS *** //
    // ************************ //
    function compound(bytes memory dexData) public {
        uint256 claimable = comptroller.compReceivable(address(this));

        if (claimable > 0) {
            comptroller.claimComp(address(this));
        }

        address compAddress = comptroller.getCompAddress();
        uint256 balanceAfter = IERC20(compAddress).balanceOf(address(this));
        if (balanceAfter > 0) {
            ISwapper.SwapData memory swapData = swapper.buildSwapData(
                compAddress,
                address(wrappedNative),
                balanceAfter,
                0,
                false,
                false
            );
            uint256 calcAmount = swapper.getOutputAmount(swapData, dexData);
            uint256 minAmount = calcAmount - (calcAmount * _slippage) / 10_000; //0.5%
            swapper.swap(swapData, minAmount, address(this), dexData);

            //stake if > depositThreshold
            uint256 queued = wrappedNative.balanceOf(address(this));
            if (queued > depositThreshold) {
                INative(address(wrappedNative)).withdraw(queued);
                cToken.mint{value: queued}();
                emit AmountDeposited(queued);
            }
            emit AmountDeposited(queued);
        }
    }

    /// @notice withdraws everythig from the strategy
    function emergencyWithdraw() external onlyOwner returns (uint256 result) {
        compound(defaultSwapData);

        uint256 toWithdraw = cToken.balanceOf(address(this));
        cToken.redeem(toWithdraw);
        INative(address(wrappedNative)).deposit{value: address(this).balance}();

        result = address(this).balance;
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 shares = cToken.balanceOf(address(this));
        uint256 pricePerShare = LibCompound.viewExchangeRate(cToken);
        uint256 invested = (shares * pricePerShare) / (10 ** 18);
        uint256 queued = wrappedNative.balanceOf(address(this));
        return queued + invested;
    }

    /// @dev deposits to Compound or queues tokens if the 'depositThreshold' has not been met yet
    ///      - when depositing to Compound, cToken is minted to this contract
    function _deposited(uint256 amount) internal override nonReentrant {
        require(!paused, "Stargate: paused");
        uint256 queued = wrappedNative.balanceOf(address(this));
        if (queued > depositThreshold) {
            INative(address(wrappedNative)).withdraw(queued);

            cToken.mint{value: queued}();
            emit AmountDeposited(queued);
            return;
        }
        emit AmountQueued(amount);
    }

    /// @dev burns yToken in exchange of Token and withdraws from Yearn Vault
    function _withdraw(
        address to,
        uint256 amount
    ) internal override nonReentrant {
        uint256 available = _currentBalance();
        require(available >= amount, "CompoundStrategy: amount not valid");

        uint256 queued = wrappedNative.balanceOf(address(this));
        if (amount > queued) {
            try
                CompoundStrategy(payable(this)).compound(defaultSwapData)
            {} catch (bytes memory) {}
            cToken.redeemUnderlying(amount);
            INative(address(wrappedNative)).deposit{
                value: address(this).balance
            }();
        }
        amount--;
        require(
            wrappedNative.balanceOf(address(this)) >= amount,
            "CompoundStrategy: not enough"
        );
        wrappedNative.safeTransfer(to, amount);

        emit AmountWithdrawn(to, amount);
    }

    receive() external payable {}
}
