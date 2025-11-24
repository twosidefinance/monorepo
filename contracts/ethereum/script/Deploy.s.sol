// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/Twoside.sol";
import {ERC1967Proxy} from "@openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployTwosideUpgradeableOnMainnet is Script {
    function run() external {
        address developerPublicKey = vm.envAddress("DEVELOPER_PUBLIC_KEY");
        address founderPublicKey = vm.envAddress("FOUNDER_PUBLIC_KEY");
        uint256 ownerPrivateKey = vm.envUint("OWNER_PRIVATE_KEY");
        address ownerPublicKey = vm.addr(ownerPrivateKey);

        vm.startBroadcast(ownerPrivateKey);

        // Deploy TwosideUpgradeable logic contract
        TwosideUpgradeable twosideImpl = new TwosideUpgradeable();

        console.log(
            "TwosideUpgradeable Implementation deployed at:",
            address(twosideImpl)
        );
        console.log("");
        console.log("");

        // Deploy proxy with initializer
        bytes memory data = abi.encodeWithSelector(
            TwosideUpgradeable.initialize.selector,
            developerPublicKey,
            founderPublicKey
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(twosideImpl), data);

        console.log("TwosideUpgradeable Proxy deployed at:", address(proxy));
        console.log("");
        console.log("");

        vm.stopBroadcast();
    }
}
