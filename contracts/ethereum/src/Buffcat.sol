// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IBuffcat} from "./IBuffcat.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin-contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";

contract BuffcatUpgradeable is
    IBuffcat,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // Constants :-
    uint256 public MIN_LOCK_VALUE;

    // Variables :-
    address public derivativeImplementation;

    address public developerWallet;
    address public founderWallet;
    mapping(address => bool) public authorizedUpdaters;

    uint256 public feePercentage;
    FeeDistribution public feeSplit;

    mapping(address => bool) public whitelistedTokens;
    mapping(address => address) tokenDerivatives;

    // Modifiers :-
    modifier onlyAuthorizedUpdater() {
        if (!authorizedUpdaters[msg.sender])
            revert NotAuthorized();
        _;
    }

    // Functions :-
    // 1. Inherited Functions :-
    // 2. Public Functions :-
    // 3. Private Functions :-
    // 4. Admin Functions :-
}
