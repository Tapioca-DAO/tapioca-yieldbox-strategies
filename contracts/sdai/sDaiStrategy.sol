// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

//OZ
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//boringcrypto
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";

// Utils
import "../feeCollector.sol";

//SDK
import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";

//interfaces
import "./interfaces/ITDai.sol";
import "../../tapioca-periph/contracts/interfaces/ISavingsDai.sol";

//For mainnet
contract sDaiStrategy is
    BaseERC20Strategy,
    BoringOwnable,
    ReentrancyGuard,
    FeeCollector
{
    using BoringERC20 for IERC20;

    bool public paused;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation is performed
    uint256 public depositThreshold;

    ISavingsDai public immutable sDai;
    IERC20 public immutable dai;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event DepositThreshold(uint256 indexed _old, uint256 indexed _new);
    event AmountQueued(uint256 indexed amount);
    event AmountDeposited(uint256 indexed amount);
    event AmountWithdrawn(address indexed to, uint256 indexed amount);

    // ************** //
    // *** ERRORS *** //
    // ************** //
    error TokenNotValid();
    error TransferFailed();
    error Paused();
    error NotEnough();

    constructor(
        IYieldBox _yieldBox,
        address _token,
        ISavingsDai _sDai,
        address _feeRecipient,
        uint256 _feeBps
    )
        BaseERC20Strategy(_yieldBox, _token)
        FeeCollector(_feeRecipient, _feeBps)
    {
        owner = msg.sender;
        sDai = _sDai;
        dai = IERC20(ITDai(_token).erc20());
        if (address(dai) != sDai.dai()) revert TokenNotValid();
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "sDai";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "sDai strategy for tDai assets";
    }

    function compoundAmount() external pure returns (uint256 result) {
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

    /// @notice rescues unused ETH from the contract
    /// @param amount the amount to rescue
    /// @param to the recipient
    function rescueEth(uint256 amount, address to) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Sets the deposit threshold
    /// @param amount The new threshold amount
    function setDepositThreshold(uint256 amount) external onlyOwner {
        emit DepositThreshold(depositThreshold, amount);
        depositThreshold = amount;
    }

    /// @notice withdraws everythig from the strategy
    function emergencyWithdraw() external onlyOwner returns (uint256 result) {
        paused = true;
        uint256 maxRedeem = sDai.maxRedeem(address(this));
        result = sDai.withdraw(maxRedeem, address(this), address(this));
        dai.approve(contractAddress, result);
        ITDai(contractAddress).wrap(address(this), address(this), result);
    }

    /// @notice withdraws fees
    function withdrawFees(uint256 _amount) external onlyOwner {
        uint256 shares = sDai.convertToShares(_amount);
        uint256 obtainedDai = sDai.redeem(shares, address(this), address(this));
        feesPending -= obtainedDai;

        dai.approve(contractAddress, obtainedDai);
        ITDai(contractAddress).wrap(address(this), address(this), obtainedDai);
        IERC20(contractAddress).safeTransfer(feeRecipient, obtainedDai);
    }

    // ************************ //
    // *** PUBLIC FUNCTIONS *** //
    // ************************ //
    function compound(bytes memory dexData) external {}

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 maxRedeem = sDai.maxRedeem(address(this));
        uint256 previewRedeem = sDai.previewRedeem(maxRedeem); //dai
        uint256 queued = IERC20(contractAddress).balanceOf(address(this)); //tDai
        return queued + previewRedeem - feesPending; //this operation is valid because dai <> tDai ratio is 1:1
    }

    /// @dev deposits to SavingsDai or queues tokens if the 'depositThreshold' has not been met yet
    function _deposited(uint256 amount) internal override nonReentrant {
        if (paused) revert Paused();
        // Assume that YieldBox already transferred the tokens to this address
        uint256 queued = IERC20(contractAddress).balanceOf(address(this)) -
            feesPending;
        if (queued >= depositThreshold) {
            ITDai(contractAddress).unwrap(address(this), queued);
            dai.approve(address(sDai), queued);
            sDai.deposit(queued, address(this));
            emit AmountDeposited(queued);
            return;
        }
        emit AmountQueued(amount);
    }

    /// @dev burns sDai in exchange of Dai and wraps it into tDai
    function _withdraw(
        address to,
        uint256 amount
    ) internal override nonReentrant {
        uint256 maxWithdraw = sDai.maxWithdraw(address(this));
        if (
            IERC20(contractAddress).balanceOf(address(this)) +
                maxWithdraw -
                feesPending <
            amount
        ) revert NotEnough(); // dai <> tDai is 1:1

        (uint256 toWithdraw, uint256 fees) = _processFees(
            maxWithdraw >= amount ? amount : maxWithdraw
        );
        feesPending += fees;

        uint256 shares = sDai.convertToShares(toWithdraw);
        uint256 obtainedDai = sDai.redeem(shares, address(this), address(this));
        dai.approve(contractAddress, obtainedDai);
        ITDai(contractAddress).wrap(address(this), address(this), obtainedDai);

        IERC20(contractAddress).safeTransfer(
            to,
            obtainedDai + (amount - (toWithdraw + fees)) // redeemed + (requested - withdrawn)
        );
    }

    receive() external payable {}
}
