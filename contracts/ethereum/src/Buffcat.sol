// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IBuffcat} from "./interfaces/IBuffcat.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin-contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";
import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";
import {IToken} from "./interfaces/IToken.sol";
import {DerivativeToken} from "./token/DerivativeToken.sol";

contract BuffcatUpgradeable is
    IBuffcat,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IToken;

    // Constants :-
    uint256 public MIN_LOCK_VALUE;

    // Variables :-
    address public derivativeImplementation;

    address public developer;
    address public founder;
    uint256 public developerShare;
    uint256 public founderShare;
    mapping(address => bool) public authorizedUpdaters;

    uint256 public feePercentage;
    uint256 public feePercentageDivider;

    mapping(address => bool) public whitelistedTokens;
    mapping(address => address) public tokenDerivatives;

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
        developerShare = 50;
        founderShare = 50;
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

        uint256 allowance = IToken(_token).allowance(msg.sender, address(this));
        if (allowance < _amount) revert InsufficientAllowance();
        if (IToken(_token).balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        address derivativeAddress = tokenDerivatives[_token];
        if (derivativeAddress == address(0)) {
            IToken t = IToken(_token);
            string memory name = t.name();
            string memory symbol = t.symbol();
            uint8 decimals = t.decimals();

            string memory derivativeName = string(abi.encodePacked("Liquid ", name));
            string memory derivativeSymbol = string(abi.encodePacked("li", symbol));

            derivativeAddress = Clones.clone(derivativeImplementation);
            IToken(derivativeAddress).initialize(address(this), derivativeName, derivativeSymbol, decimals);
            emit DerivativeContractDeployed(_token, derivativeAddress, block.timestamp);
            tokenDerivatives[_token] = derivativeAddress;
        }

        IToken(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        uint256 fee = calculateFee(_amount);
        uint256 deductedAmount = _amount - fee;

        distributeFee(_token, fee);

        IToken(derivativeAddress).mint(msg.sender, deductedAmount);
        emit AssetsLocked(msg.sender, _token, _amount, block.timestamp);
    }

    function unlock(address _token, address _derivative, uint256 _amount) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        if (_derivative == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmountValue();
        if (_amount < MIN_LOCK_VALUE) revert InvalidAmount();
        if (!whitelistedTokens[_token]) revert NotWhitelisted();

        address derivativeAddress = tokenDerivatives[_token];
        if (derivativeAddress == address(0)) revert NoDerivativeDeployed();
        if (derivativeAddress != _derivative) revert InvalidDerivativeAddress();

        uint256 allowance = IToken(_derivative).allowance(msg.sender, address(this));
        if (allowance < _amount) revert InsufficientAllowance();
        if (IToken(_derivative).balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        IToken(_derivative).safeTransferFrom(msg.sender, address(this), _amount);
        
        uint256 fee = calculateFee(_amount);
        uint256 deductedAmount = _amount - fee;

        distributeFee(_token, fee);

        IToken(_derivative).burn(_amount);
        IToken(_token).transfer(msg.sender, deductedAmount);
        emit AssetsUnlocked(msg.sender, _token, _amount, block.timestamp);
    }

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
        uint256 developerFeeShare = (_fee * developerShare) / 100;
        uint256 founderFeeShare = (_fee * founderShare) / 100;

        IToken(_token).safeTransfer(developer, developerFeeShare);
        IToken(_token).safeTransfer(founder, founderFeeShare);

        emit DeveloperFeesDistributed(developer, _token, developerFeeShare, block.timestamp);
        emit FounderFeesDistributed(founder, _token, founderFeeShare, block.timestamp);
    }

    function calculateFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * feePercentage) / feePercentageDivider;
    }

    // Private -
    function addAuthorizeUpdaters(address[] calldata _accounts) external onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            address account = _accounts[i];
            if (account == address(0)) revert ZeroAddress();
            authorizedUpdaters[account] = true;
        }
    }

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

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
