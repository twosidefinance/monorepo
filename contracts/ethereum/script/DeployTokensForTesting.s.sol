// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {IToken} from "../../src/interfaces/IToken.sol";
import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";
import "../src/Twoside.sol";

contract DeployTokensForTesting is Script {
    function run() external {
        uint256 userPrivateKey = vm.envUint("OWNER_PRIVATE_KEY");
        address userPublicKey = vm.addr(userPrivateKey);
        address twosideAddr = vm.envAddress("TWOSIDE_CONTRACT_ADDRESS");

        TwosideUpgradeable twoside = TwosideUpgradeable(twosideAddr);

        vm.startBroadcast(userPrivateKey);

        // Get token implementation address
        address tokenImplementation = twoside.derivativeImplementation();
        console.log("Token implementation at:", tokenImplementation);
        console.log("");
        console.log("");

        uint256 initialBalance = 100 * 10 ** 18;

        // Deploy & mint 5 tokens
        for (uint8 i = 1; i <= 5; i++) {
            string memory name = string(
                abi.encodePacked("Token", vm.toString(i))
            );
            string memory symbol = string(
                abi.encodePacked("T", vm.toString(i))
            );
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
