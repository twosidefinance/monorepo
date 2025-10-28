// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../../src/Twoside.sol";
import {IToken} from "../../src/interfaces/IToken.sol";
import {ERC1967Proxy} from "@openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";

contract DeployTwosideUpgradeableOnTestnet is Script {
    function run() external {
        uint256 userPrivateKey = vm.envUint("NEW_USER_PRIVATE_KEY");
        address userPublicKey = vm.addr(userPrivateKey);

        uint256 developerPrivateKey = vm.envUint("USER1_PRIVATE_KEY");
        address developer = vm.addr(developerPrivateKey);
        uint256 founderPrivateKey = vm.envUint("USER2_PRIVATE_KEY");
        address founder = vm.addr(founderPrivateKey);

        vm.startBroadcast(userPrivateKey);

        // Deploy TwosideUpgradeable logic contract
        TwosideUpgradeable twosideImpl = new TwosideUpgradeable();

        // Deploy proxy with initializer
        bytes memory data = abi.encodeWithSelector(
            TwosideUpgradeable.initialize.selector,
            developer,
            founder
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(twosideImpl), data);
        TwosideUpgradeable twoside = TwosideUpgradeable(address(proxy));

        console.log("TwosideUpgradeable deployed at:", address(proxy));
        console.log("");
        console.log("");

        // Get token implementation address
        address tokenImplementation = twoside.derivativeImplementation();
        console.log("Token implementation at:", tokenImplementation);
        console.log("");
        console.log("");

        uint256 initialBalance = 100 * 10 ** 18;

        // Deploy & mint 5 tokens
        for (uint8 i = 1; i <= 5; i++) {
            string memory name = string(abi.encodePacked("Token", vm.toString(i)));
            string memory symbol = string(abi.encodePacked("T", vm.toString(i)));
            uint8 decimals = 18;

            address token = Clones.clone(tokenImplementation);
            IToken(token).initialize(userPublicKey, name, symbol, decimals);
            IToken(token).mint(userPublicKey, initialBalance);

            console.log(name, "deployed at:", token);
            console.log("Symbol:", symbol);
            console.log("Decimals:", decimals);
            console.log("Minted to:", userPublicKey);
            console.log("Amount:", initialBalance);
            console.log("");
            console.log("");


            if (i == 1) {
                uint256 lockAmount = 10 * 10 ** 18;
                IToken(token).approve(address(twoside), lockAmount);
                twoside.lock(token, lockAmount);
                address derivative = twoside.tokenDerivatives(token);
                console.log("Token1 Derivative:", derivative);
                console.log("");
                console.log("");
            }
        }

        vm.stopBroadcast();
    }
}
