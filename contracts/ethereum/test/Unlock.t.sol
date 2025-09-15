// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.22;

import {console} from "forge-std/Console.sol";
import {TestSetUp} from "./TestSetUp.sol";
import {IBuffcat} from "../src/interfaces/IBuffcat.sol";
import {BuffcatUpgradeable} from "../src/Buffcat.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract UnlockTests is TestSetUp {
    function testUnlocking() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        buffcat.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = buffcat.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        fees = calculateFee(lockedAmount);
        uint256 unlockAmount = lockedAmount - fees;
        IERC20(derivative).approve(address(buffcat), lockedAmount);
        buffcat.unlock(address(token1), derivative, lockedAmount);

        balance = token1.balanceOf(user);
        assertEq(balance, (initialBalance - lockAmount) + unlockAmount, "Wrong Balance 3");

        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, 0, "Wrong Balance 4");

        vm.stopPrank();
    }

    function testInvalidTokenInputs() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        buffcat.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = buffcat.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        fees = calculateFee(lockedAmount);
        IERC20(derivative).approve(address(buffcat), lockedAmount);

        vm.expectRevert(IBuffcat.ZeroAddress.selector);
        buffcat.unlock(address(0), derivative, lockedAmount);
        vm.expectRevert(IBuffcat.ZeroAddress.selector);
        buffcat.unlock(address(token1), address(0), lockedAmount);

        vm.expectRevert(IBuffcat.NoDerivativeDeployed.selector);
        buffcat.unlock(address(token2), derivative, lockedAmount);
        vm.expectRevert(IBuffcat.InvalidDerivativeAddress.selector);
        buffcat.unlock(address(token1), address(token2), lockedAmount);

        vm.stopPrank();
    }

    function testInvalidAmountInputs() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        buffcat.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = buffcat.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        IERC20(derivative).approve(address(buffcat), lockedAmount);
        vm.expectRevert(IBuffcat.ZeroAmountValue.selector);
        buffcat.unlock(address(token1), derivative, uint256(0));

        vm.stopPrank();
    }

    function testUnlockingBlacklistedToken() public {
        vm.startPrank(user);

        uint256 lockAmount = 10e18;
        vm.expectRevert(IBuffcat.NotWhitelisted.selector);
        buffcat.lock(address(token3), lockAmount);

        uint256 unlockAmount = 1e18;

        vm.expectRevert(IBuffcat.NotWhitelisted.selector);
        buffcat.unlock(address(token3), address(token1), unlockAmount);

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

        address derivative = buffcat.tokenDerivatives(address(token1));
        uint256 unlockAmount = 1e18;
        IERC20(derivative).approve(address(buffcat), unlockAmount); 
        ts = block.timestamp;
        vm.expectEmit(true, true, true, true);
        emit IBuffcat.AssetsUnlocked(user, address(token1), unlockAmount, ts);
        buffcat.unlock(address(token1), derivative, unlockAmount);

        vm.stopPrank();
    }

    function testDerivativeTokenContract() public {
        vm.startPrank(user);

        token1.approve(address(buffcat), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        buffcat.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = buffcat.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        uint256 supply = IERC20(derivative).totalSupply();
        assertEq(supply, lockedAmount, "Wrong Total Supply 1");

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

        IERC20(derivative).approve(address(buffcat), lockedAmount);
        buffcat.unlock(address(token1), derivative, lockedAmount);

        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, 0, "Wrong Balance 3");

        supply = IERC20(derivative).totalSupply();
        assertEq(supply, 0, "Wrong Total Supply 2");

        vm.stopPrank();
    }
}