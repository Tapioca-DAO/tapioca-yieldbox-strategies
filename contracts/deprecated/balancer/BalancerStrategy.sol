// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
import "@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";

import "tapioca-sdk/dist/contracts/YieldBox/contracts/strategies/BaseStrategy.sol";
import "./interfaces/IBalancerVault.sol";
import "./interfaces/IBalancerPool.sol";
import "./interfaces/IBalancerHelpers.sol";

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

contract BalancerStrategy is BaseERC20Strategy, BoringOwnable, ReentrancyGuard {
    using BoringERC20 for IERC20;

    // ************ //
    // *** VARS *** //
    // ************ //
    IERC20 public immutable wrappedNative;
    IERC20 public immutable bal;

    bytes32 public poolId;
    IBalancerVault public immutable vault;
    IBalancerPool public immutable pool; //lp token
    IBalancerHelpers public immutable helpers;
    address[] public rewardTokens;

    /// @notice Queues tokens up to depositThreshold
    /// @dev When the amount of tokens is greater than the threshold, a deposit operation to Yearn is performed
    uint256 public depositThreshold;

    uint256 private _cachedCalculatedAmount;
    uint256 private _slippage = 50;
    uint256 private _slippageIn = 250;
    bytes public defaultSwapData;

    bool public paused;

    // ************** //
    // *** EVENTS *** //
    // ************** //
    event RewardTokens(uint256 indexed _count);
    event DepositThreshold(uint256 indexed _old, uint256 indexed _new);
    event AmountQueued(uint256 indexed amount);
    event AmountDeposited(uint256 indexed amount);
    event AmountWithdrawn(address indexed to, uint256 indexed amount);

    constructor(
        IYieldBox _yieldBox,
        address _token,
        address _vault,
        bytes32 _poolId,
        address _bal,
        address _helpers
    ) BaseERC20Strategy(_yieldBox, _token) {
        wrappedNative = IERC20(_token);
        bal = IERC20(_bal);

        vault = IBalancerVault(_vault);
        poolId = _poolId;

        (address _stablePool, ) = vault.getPool(_poolId);
        pool = IBalancerPool(_stablePool);

        helpers = IBalancerHelpers(_helpers);

        wrappedNative.approve(_vault, 0);
        wrappedNative.approve(_vault, type(uint256).max);
        IERC20(address(pool)).approve(_vault, 0);
        IERC20(address(pool)).approve(_vault, type(uint256).max);
    }

    // ********************** //
    // *** VIEW FUNCTIONS *** //
    // ********************** //
    /// @notice Returns the name of this strategy
    function name() external pure override returns (string memory name_) {
        return "Balancer";
    }

    /// @notice Returns the description of this strategy
    function description()
        external
        pure
        override
        returns (string memory description_)
    {
        return "Balancer strategy for wrapped native assets";
    }

    /// @notice returns compounded amounts in wrappedNative
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

    /// @notice sets the slippage used in bptIn operation
    /// @param _val the new slippage amount
    function setSlippageIn(uint256 _val) external onlyOwner {
        _slippageIn = _val;
    }

    /// @notice rescues unused ETH from the contract
    /// @param amount the amount to rescue
    /// @param to the recipient
    function rescueEth(uint256 amount, address to) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        require(success, "Balancer: transfer failed.");
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
    function compound(bytes memory) public {}

    /// @notice withdraws everythig from the strategy
    function emergencyWithdraw() external onlyOwner returns (uint256 result) {
        uint256 toWithdraw = updateCache();
        toWithdraw = toWithdraw - (toWithdraw * _slippage) / 10_000; //0.5%

        result = _vaultWithdraw(toWithdraw);
        paused = true;
    }

    // ************************* //
    // *** PRIVATE FUNCTIONS *** //
    // ************************* //
    function _currentBalance() internal view override returns (uint256 amount) {
        uint256 queued = wrappedNative.balanceOf(address(this));

        return _cachedCalculatedAmount + queued;
    }

    /// @dev deposits to Balancer or queues tokens if the 'depositThreshold' has not been met yet
    ///      - when depositing to Balancer, cToken is minted to this contract
    function _deposited(uint256 amount) internal override nonReentrant {
        require(!paused, "Stargate: paused");
        uint256 queued = wrappedNative.balanceOf(address(this));
        if (queued > depositThreshold) {
            _vaultDeposit(queued);
            emit AmountDeposited(queued);
        }
        emit AmountQueued(amount);

        updateCache();
    }

    function _vaultDeposit(uint256 amount) private {
        uint256 lpBalanceBefore = pool.balanceOf(address(this));

        (address[] memory poolTokens, , ) = vault.getPoolTokens(poolId);

        int256 index = -1;
        uint256[] memory maxAmountsIn = new uint256[](poolTokens.length);
        for (uint256 i; i < poolTokens.length; i++) {
            if (poolTokens[i] == address(wrappedNative)) {
                maxAmountsIn[i] = amount;
                index = int256(i);
            } else {
                maxAmountsIn[i] = 0;
            }
        }

        IBalancerVault.JoinPoolRequest memory joinPoolRequest;
        joinPoolRequest.assets = poolTokens;
        joinPoolRequest.maxAmountsIn = maxAmountsIn;
        joinPoolRequest.fromInternalBalance = false;
        joinPoolRequest.userData = abi.encode(1, maxAmountsIn);

        (uint256 bptOut, ) = helpers.queryJoin(
            poolId,
            address(this),
            address(this),
            joinPoolRequest
        );
        bptOut = bptOut - (bptOut * _slippage) / 10_000; //0.5%

        joinPoolRequest.userData = abi.encode(2, bptOut, uint256(index));

        vault.joinPool(poolId, address(this), address(this), joinPoolRequest);
        uint256 lpBalanceAfter = pool.balanceOf(address(this));

        require(
            lpBalanceAfter > lpBalanceBefore,
            "BalancerStrategy: vault deposit failed"
        );
    }

    /// @dev burns yToken in exchange of Token and withdraws from Yearn Vault
    function _withdraw(
        address to,
        uint256 amount
    ) internal override nonReentrant {
        uint256 available = _currentBalance();
        require(available >= amount, "BalancerStrategy: amount not valid");

        uint256 queued = wrappedNative.balanceOf(address(this));
        if (amount > queued) {
            uint256 pricePerShare = pool.getRate();
            uint256 decimals = IStrictERC20(address(pool)).decimals();
            uint256 toWithdraw = (((amount - queued) * (10 ** decimals)) /
                pricePerShare);

            _vaultWithdraw(toWithdraw);
        }

        require(
            amount <= wrappedNative.balanceOf(address(this)),
            "BalancerStrategy: not enough"
        );
        wrappedNative.safeTransfer(to, amount);
        updateCache();

        emit AmountWithdrawn(to, amount);
    }

    function _vaultWithdraw(uint256 amount) private returns (uint256) {
        uint256 wrappedNativeBalanceBefore = wrappedNative.balanceOf(
            address(this)
        );
        (address[] memory poolTokens, , ) = vault.getPoolTokens(poolId);
        int256 index = -1;
        uint256[] memory minAmountsOut = new uint256[](poolTokens.length);
        for (uint256 i; i < poolTokens.length; i++) {
            if (poolTokens[i] == address(wrappedNative)) {
                minAmountsOut[i] = amount;
                index = int256(i);
            } else {
                minAmountsOut[i] = 0;
            }
        }

        IBalancerVault.ExitPoolRequest memory exitRequest;
        exitRequest.assets = poolTokens;
        exitRequest.minAmountsOut = minAmountsOut;
        exitRequest.toInternalBalance = false;
        exitRequest.userData = abi.encode(
            2,
            exitRequest.minAmountsOut,
            pool.balanceOf(address(this))
        );

        (uint256 bptIn, ) = helpers.queryExit(
            poolId,
            address(this),
            payable(this),
            exitRequest
        );
        bptIn = bptIn + (bptIn * _slippageIn) / 10_000; //2.5%
        uint256 maxBpt = pool.balanceOf(address(this));
        if (bptIn > maxBpt) {
            bptIn = maxBpt;
        }
        exitRequest.userData = abi.encode(0, bptIn, index);

        vault.exitPool(poolId, address(this), payable(this), exitRequest);

        uint256 wrappedNativeBalanceAfter = wrappedNative.balanceOf(
            address(this)
        );

        require(
            wrappedNativeBalanceAfter > wrappedNativeBalanceBefore,
            "BalancerStrategy: vault withdrawal failed"
        );

        return wrappedNativeBalanceAfter - wrappedNativeBalanceBefore;
    }

    function updateCache() public returns (uint256) {
        uint256 lpBalance = pool.balanceOf(address(this));

        (address[] memory poolTokens, , ) = vault.getPoolTokens(poolId);
        uint256 index;
        uint256[] memory minAmountsOut = new uint256[](poolTokens.length);
        for (uint256 i; i < poolTokens.length; i++) {
            if (poolTokens[i] == address(wrappedNative)) {
                index = i;
            }
            minAmountsOut[i] = 0;
        }

        IBalancerVault.ExitPoolRequest memory exitRequest;
        exitRequest.assets = poolTokens;
        exitRequest.minAmountsOut = minAmountsOut;
        exitRequest.toInternalBalance = false;
        exitRequest.userData = abi.encode(0, lpBalance, index);

        (, uint256[] memory amountsOut) = helpers.queryExit(
            poolId,
            address(this),
            address(this),
            exitRequest
        );

        _cachedCalculatedAmount = amountsOut[index];
        return amountsOut[index];
    }

    receive() external payable {}
}
