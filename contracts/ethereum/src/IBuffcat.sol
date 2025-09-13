// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IBuffcat {
    // Events :-
    event DeveloperFeesDistributed(address developerWallet, address token, uint256 fees, uint256 timestamp);
    event FounderFeesDistributed(address founderWallet, address token, uint256 fees, uint256 timestamp);
    event TokenWhitelisted(address token, uint256 timestamp);
    event TokenBlacklisted(address token, uint256 timestamp);
    event AssetsLocked(address account, address token, uint256 amount, uint256 timestamp);
    event AssetsUnlocked(address account, address token, uint256 amount, uint256 timestamp);
    event DerivativeContractDeployed(address token, address derivative, uint256 timestamp);

    // Errors :-
    error NotAuthorized();
    error ZeroAmountValue();
    error ZeroAddress();
    error InvalidAmount();
    error NotWhitelisted();
    error InsufficientAllowance();
    error InsufficientBalance();

    // Functions :-
    function lock(address _token, uint256 _amount) external;
    function unlock(address _token, uint256 _amount) external;
}