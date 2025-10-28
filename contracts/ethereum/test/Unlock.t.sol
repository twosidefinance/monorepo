// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.22;

import {console} from "forge-std/console.sol";
import {TestSetUp} from "./TestSetUp.sol";
import {ITwoside} from "../src/interfaces/ITwoside.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract UnlockTests is TestSetUp {
    function testUnlocking() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        twoside.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = twoside.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        fees = calculateFee(lockedAmount);
        uint256 unlockAmount = lockedAmount - fees;
        IERC20(derivative).approve(address(twoside), lockedAmount);
        twoside.unlock(address(token1), lockedAmount);

        balance = token1.balanceOf(user);
        assertEq(balance, (initialBalance - lockAmount) + unlockAmount, "Wrong Balance 3");

        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, 0, "Wrong Balance 4");

        vm.stopPrank();
    }

    function testInvalidTokenInputs() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        twoside.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = twoside.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        fees = calculateFee(lockedAmount);
        IERC20(derivative).approve(address(twoside), lockedAmount);

        vm.expectRevert(ITwoside.ZeroAddress.selector);
        twoside.unlock(address(0), lockedAmount);

        vm.expectRevert(ITwoside.NoDerivativeDeployed.selector);
        twoside.unlock(address(token2), lockedAmount);

        vm.stopPrank();
    }

    function testInvalidAmountInputs() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        twoside.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = twoside.tokenDerivatives(address(token1));
        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, lockedAmount, "Wrong Balance 2");

        IERC20(derivative).approve(address(twoside), lockedAmount);
        vm.expectRevert(ITwoside.ZeroAmountValue.selector);
        twoside.unlock(address(token1), uint256(0));

        vm.stopPrank();
    }

    function testEventsEmits() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 ts = block.timestamp;
        vm.expectEmit(true, true, true, true);
        emit ITwoside.AssetsLocked(user, address(token1), lockAmount, ts);
        twoside.lock(address(token1), lockAmount);

        address derivative = twoside.tokenDerivatives(address(token1));
        uint256 unlockAmount = 1e18;
        IERC20(derivative).approve(address(twoside), unlockAmount); 
        ts = block.timestamp;
        vm.expectEmit(true, true, true, true);
        emit ITwoside.AssetsUnlocked(user, address(token1), unlockAmount, ts);
        twoside.unlock(address(token1), unlockAmount);

        vm.stopPrank();
    }

    function testDerivativeTokenContract() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 lockedAmount = lockAmount - fees;
        twoside.lock(address(token1), lockAmount);

        uint256 balance = token1.balanceOf(user);
        assertEq(balance, initialBalance - lockAmount, "Wrong Balance 1");

        address derivative = twoside.tokenDerivatives(address(token1));
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

        IERC20(derivative).approve(address(twoside), lockedAmount);
        twoside.unlock(address(token1), lockedAmount);

        balance = IERC20(derivative).balanceOf(user);
        assertEq(balance, 0, "Wrong Balance 3");

        supply = IERC20(derivative).totalSupply();
        assertEq(supply, 0, "Wrong Total Supply 2");

        vm.stopPrank();
    }
}