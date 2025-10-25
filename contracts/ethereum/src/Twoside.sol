// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ITwoside} from "./interfaces/ITwoside.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin-contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {PausableUpgradeable} from "@openzeppelin-contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";
import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";
import {IToken} from "./interfaces/IToken.sol";
import {DerivativeToken} from "./token/DerivativeToken.sol";

contract TwosideUpgradeable is
    ITwoside,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard
{
    using SafeERC20 for IToken;

    // Variables :-
    address public derivativeImplementation;

    address public developer;
    address public founder;
    uint256 public developerShare;
    uint256 public founderShare;
    mapping(address => bool) public authorizedUpdaters;

    uint256 public feePercentage;
    uint256 public feePercentageDivider;
    uint256 public minFeeForDistribution;
    uint256 public minFee;

    mapping(address => bool) public whitelistedTokens;
    mapping(address => address) public tokenDerivatives;
    mapping(address => address) public tokenOfDerivative;

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
        __Pausable_init();

        developer = _developer;
        founder = _founder;
        developerShare = 50;
        founderShare = 50;
        derivativeImplementation = address(new DerivativeToken());
        feePercentage = 5;
        feePercentageDivider = 1000;
        minFeeForDistribution = 2;
        minFee = 2;
    }

    // External -
    function lock(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmountValue();
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
            tokenOfDerivative[derivativeAddress] = _token;
        }

        IToken(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        uint256 fee = calculateFee(_amount);
        uint256 deductedAmount = _amount - fee;

        distributeFee(_token, fee);

        IToken(derivativeAddress).mint(msg.sender, deductedAmount);
        emit AssetsLocked(msg.sender, _token, _amount, block.timestamp);
    }

    function unlock(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        if (_token == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmountValue();
        if (!whitelistedTokens[_token]) revert NotWhitelisted();

        address derivativeAddress = tokenDerivatives[_token];
        if (derivativeAddress == address(0)) revert NoDerivativeDeployed();

        uint256 allowance = IToken(derivativeAddress).allowance(msg.sender, address(this));
        if (allowance < _amount) revert InsufficientAllowance();
        if (IToken(derivativeAddress).balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        IToken(derivativeAddress).safeTransferFrom(msg.sender, address(this), _amount);
        
        uint256 fee = calculateFee(_amount);
        uint256 deductedAmount = _amount - fee;

        distributeFee(_token, fee);

        IToken(derivativeAddress).burn(_amount);
        bool success  = IToken(_token).transfer(msg.sender, deductedAmount);
        if (!success) revert TokenTransferFailed();
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
        uint256 fee = (_amount * feePercentage) / feePercentageDivider;
        if (fee < minFeeForDistribution) fee = minFee;
        if (fee >= _amount) revert AmountInsufficientAfterFee();
        return fee;
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
