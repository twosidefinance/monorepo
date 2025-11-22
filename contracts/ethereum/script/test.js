import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://localhost:8545");

const contractAddress = "0xA15BB66138824a1c7167f5E85b957d04Dd34E468";

const abi = [
  "function tokenDerivatives(address token) external view returns (address)",
];

const contract = new ethers.Contract(contractAddress, abi, provider);

async function main() {
  const token = "0xeD1DB453C3156Ff3155a97AD217b3087D5Dc5f6E";

  const derivative = await contract.tokenDerivatives(token);

  console.log(`Derivative for ${token}: ${derivative}`);
}

main().catch(console.error);
