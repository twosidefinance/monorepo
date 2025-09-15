// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.22;

import {console} from "forge-std/Console.sol";
import {TestSetUp} from "./TestSetUp.sol";
import {IBuffcat} from "../src/interfaces/IBuffcat.sol";
import {BuffcatUpgradeable} from "../src/Buffcat.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract LockTests is TestSetUp {
    function testLocking() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = (lockAmount * 5) / 1000;
        uint256 lockedAmount = lockAmount - fees;
        buffcat.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance");

        address derivative = buffcat.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance");

        vm.stopPrank();
    }

    function testInvalidTokenInputs() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        vm.expectRevert(IBuffcat.ZeroAddress.selector);
        buffcat.lock(address(0), lockAmount);

        vm.stopPrank();
    }

    function testInvalidAmountInputs() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 0;
        vm.expectRevert(IBuffcat.ZeroAmountValue.selector);
        buffcat.lock(address(token1), lockAmount);

        lockAmount = 399;
        vm.expectRevert(IBuffcat.InvalidAmount.selector);
        buffcat.lock(address(token1), lockAmount);

        vm.stopPrank();
    }

    function testLockingBlacklistedToken() public {
        vm.startPrank(user);

        token3.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        vm.expectRevert(IBuffcat.NotWhitelisted.selector);
        buffcat.lock(address(token3), lockAmount);

        vm.stopPrank();
    }

    function testEventsEmits() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 ts = block.timestamp;
        vm.expectEmit(true, true, true, true);
        emit IBuffcat.AssetsLocked(user, address(token1), lockAmount, ts);
        buffcat.lock(address(token1), lockAmount);

        vm.stopPrank();
    }

    function testDerivativeTokenDeployment() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = (lockAmount * 5) / 1000;
        uint256 lockedAmount = lockAmount - fees;
        buffcat.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance");

        address derivative = buffcat.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance");

        uint256 supply = IERC20(derivative).totalSupply();
        assertEq(supply, lockedAmount, "Wrong Total Supply");

        string memory name = token1.name();
        string memory symbol = token1.symbol();
        uint8 decimals = token1.decimals();

        string memory expectedDerivativeName = string(abi.encodePacked("Liquid ", name));
        string memory expectedDerivativeSymbol = string(abi.encodePacked("li", symbol));
        uint8 expectedDerivativeDecimals = decimals;

        string memory derivativeName = IERC20Metadata(derivative).name();
        string memory derivativeSymbol = IERC20Metadata(derivative).symbol();
        uint8 derivativeDecimals = IERC20Metadata(derivative).decimals();

        assertEq(derivativeName, expectedDerivativeName, "Wrong Derivative Name");
        assertEq(derivativeSymbol, expectedDerivativeSymbol, "Wrong Derivative Symbol");
        assertEq(derivativeDecimals, expectedDerivativeDecimals, "Wrong Derivative Decimals");

        vm.stopPrank();
    }
}