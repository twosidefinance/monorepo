// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.22;

import { Test } from 'forge-std/Test.sol';
import { BuffcatUpgradeable } from "../src/Buffcat.sol";
import { ERC1967Proxy } from "@openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { Token } from "./Token.sol";

contract TestSetUp is Test {
    BuffcatUpgradeable public buffcat;
    address public owner = address(1906);
    address public developer = address(1907);
    address public founder = address(1908);
    address public user = address(1);
    uint256 public initialBalance = 1_000_000e18;

    Token public token1;
    Token public token2;
    Token public token3;

    function setUp() public {
        vm.startPrank(owner);

        buffcat = new BuffcatUpgradeable();
        bytes memory data = abi.encodeWithSelector(
            BuffcatUpgradeable.initialize.selector,
            developer,
            founder
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(buffcat), data);
        buffcat = BuffcatUpgradeable(address(proxy));

        token1 = new Token(address(owner), "Token1", "TKN1");
        token2 = new Token(address(owner), "Token2", "TKN2");
        token3 = new Token(address(owner), "Token3", "TKN3");
        token1.mint(user, initialBalance);
        token2.mint(user, initialBalance);
        token3.mint(user, initialBalance);

        address[] memory updaters = new address[](1);
        updaters[0] = owner;
        buffcat.addAuthorizeUpdaters(updaters);

        address[] memory tokenWhitelist = new address[](2);
        tokenWhitelist[0] = address(token1);
        tokenWhitelist[1] = address(token2);
        buffcat.whitelist(tokenWhitelist);

        vm.stopPrank();
    }
}