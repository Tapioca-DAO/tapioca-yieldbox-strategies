// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

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

interface IFeeCollector {
    function withdrawFees(uint256 amount) external;

    function updateFeeRecipient(address _val) external;
}

contract FeeCollector {
    uint256 public immutable FEE_BPS;
    uint256 internal constant FEE_PRECISION = 10_000;
    address public feeRecipient;
    uint256 public feesPending;

    constructor(address _feeRecipient, uint256 feeBps) {
        feeRecipient = _feeRecipient;
        FEE_BPS = feeBps;
    }

    /// @notice Process fees
    /// @param _amount Amount to process fees on
    /// @return netAmount Amount after fees
    /// @return fee Amount of fees
    function _processFees(uint256 _amount) internal view returns (uint256 netAmount, uint256 fee) {
        fee = (_amount * FEE_BPS) / FEE_PRECISION;
        netAmount = _amount - fee;
    }
}
