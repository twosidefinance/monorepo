// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IDerivativeToken is IERC20, IERC20Metadata {
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function mint(address to, uint256 amount) external;
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;
}