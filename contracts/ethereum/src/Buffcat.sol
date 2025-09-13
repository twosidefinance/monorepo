// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IBuffcat} from "./IBuffcat.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {OwnableUpgradeable} from "@openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin-contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";
import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";
import {IDerivativeToken} from "./IDerivativeToken.sol";

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

    address public developer;
    address public founder;
    mapping(address => bool) public authorizedUpdaters;

    uint256 public feePercentage;
    uint256 public feePercentageDivider;

    mapping(address => bool) public whitelistedTokens;
    mapping(address => address) tokenDerivatives;
    mapping(address => uint256) lockedTokensCount;

    // Modifiers :-
    modifier onlyAuthorizedUpdater() {
        if (!authorizedUpdaters[msg.sender])
            revert NotAuthorized();
        _;
    }

    // Functions :-

    // Constructor -
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _developer,
        address _founder
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        developer = _developer;
        founder = _founder;
        derivativeImplementation = address(new DerivativeToken());
        MIN_LOCK_VALUE = 400;
        feePercentage = 5;
        feePercentageDivider = 1000;
    }

    // External -
    function lock(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmountValue();
        if (_amount < MIN_LOCK_VALUE) revert InvalidAmount();
        if (!whitelistedTokens[_token]) revert NotWhitelisted();
        uint256 allowance = IERC20(_token).allowance(msg.sender, address(this));
        if (allowance < _amount) revert InsufficientAllowance();
        if (IERC20(_token).balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        address derivateAddress = tokenDerivatives[_token];
        if (derivateAddress == address(0)) {
            IERC20Metadata t = IERC20Metadata(_token);
            string memory name = t.name();
            string memory symbol = t.symbol();
            uint8 decimals = t.decimals();

            string memory derivativeName = string(abi.encodePacked("Liquid ", name));
            string memory derivativeSymbol = string(abi.encodePacked("li", symbol));

            derivateAddress = Clones.clone(derivativeImplementation);
            IDerivativeToken(derivateAddress).initialize(address(this), derivativeName, derivativeSymbol, decimals);
            emit DerivativeContractDeployed(_token, derivateAddress, block.timestamp);
        }

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        uint256 fee = calculateFee(_amount);
        uint256 deductedAmount = _amount - fee;

        distributeFee(_token, fee);

        IDerivativeToken(_token).mint(msg.sender, deductedAmount);
        emit AssetsLocked(msg.sender, _token, deductedAmount, block.timestamp);
    }

    function unlock(address _token, uint256 _amount) external nonReentrant whenNotPaused {}

    // Internal -
    function _authorizeUpgrade(
        address _newImplementation
    ) internal override onlyOwner {
        // Additional validation logic could go here if needed
    }

    function distributeFee(
        address _token,
        uint256 _fee
    ) internal {
        uint256 half = _fee / 2;

        IERC20(_token).safeTransfer(founder, half);
        IERC20(_token).safeTransfer(developer, half);

        emit DeveloperFeesDistributed(developer, _token, half, block.timestamp);
        emit FounderFeesDistributed(founder, _token, half, block.timestamp);
    }

    function calculateFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * feePercentage) / feePercentageDivider;
    }

    // Private -
    function whitelist(
        address[] calldata _tokens
    ) external onlyAuthorizedUpdater {
        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];
            if (token == address(0)) revert ZeroAddress();
            whitelistedTokens[token] = true;
            emit TokenWhitelisted(token, block.timestamp);
        }
    }

    function blacklist(
        address[] calldata _tokens
    ) external onlyAuthorizedUpdater {
        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];
            if (token == address(0)) revert ZeroAddress();
            whitelistedTokens[token] = false;
            emit TokenBlacklisted(token, block.timestamp);
        }
    }
}
