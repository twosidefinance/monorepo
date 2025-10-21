// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.22;

import {console} from "forge-std/console.sol";
import {TestSetUp} from "./TestSetUp.sol";
import {ITwoside} from "../src/interfaces/ITwoside.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract LockTests is TestSetUp {
    function testFeeDistribution() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 10e18;
        uint256 fees = calculateFee(lockAmount);
        uint256 feeShare = fees / 2;
        twoside.lock(address(token1), lockAmount);

        uint256 founderBalance = token1.balanceOf(founder);
        assertEq(founderBalance, feeShare, "Wrong Founder Balance");

        uint256 developerBalance = token1.balanceOf(developer);
        assertEq(developerBalance, feeShare, "Wrong Developer Balance");

        vm.stopPrank();
    }

    function testMinimumFee() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 399;
        uint256 fees = calculateFee(lockAmount);
        uint256 feeShare = fees / 2;
        twoside.lock(address(token1), lockAmount);

        uint256 founderBalance = token1.balanceOf(founder);
        assertEq(founderBalance, feeShare, "Wrong Founder Balance");

        uint256 developerBalance = token1.balanceOf(developer);
        assertEq(developerBalance, feeShare, "Wrong Developer Balance");

        vm.stopPrank();
    }

    function testInvalidAmount() public {
        vm.startPrank(user);

        token1.approve(address(twoside), initialBalance);

        uint256 lockAmount = 1;
        vm.expectRevert(ITwoside.AmountInsufficientAfterFee.selector);
        twoside.lock(address(token1), lockAmount);

        lockAmount = 2;
        vm.expectRevert(ITwoside.AmountInsufficientAfterFee.selector);
        twoside.lock(address(token1), lockAmount);

        vm.stopPrank();
    }
}