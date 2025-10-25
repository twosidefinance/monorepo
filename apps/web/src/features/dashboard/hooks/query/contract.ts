import { Blockchain } from "@/types/global";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ethers } from "ethers";
import { envVariables } from "@/lib/envVariables";
import { Connection, PublicKey } from "@solana/web3.js";

interface UseTokenBalanceParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
}

export function useTokenDerivative(
  { chain, tokenAddressOrMint }: UseTokenBalanceParams,
  options?: UseQueryOptions<string, Error>
) {
  return useQuery<string, Error>({
    queryKey: ["tokenDerivative", chain, tokenAddressOrMint],
    enabled: !!chain && !!tokenAddressOrMint,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      switch (chain.name) {
        case "Ethereum":
        case "Base": {
          const rpcUrl =
            chain.name === "Ethereum"
              ? process.env.NEXT_PUBLIC_ETH_RPC_URL!
              : process.env.NEXT_PUBLIC_BASE_RPC_URL!;
          const provider = new ethers.JsonRpcProvider(rpcUrl);

          const abi = [
            "function tokenDerivatives(address token) view returns (address)",
          ];

          const twosideContract =
            chain.id == "eth"
              ? envVariables.twosideContract.eth
              : envVariables.twosideContract.base;
          if (twosideContract == "") {
            throw new Error("Twoside contract address not set.");
          }

          const contract = new ethers.Contract(twosideContract, abi, provider);

          console.log("Blockchain: ", chain.name);
          console.log("Twoside Contract: ", twosideContract);
          console.log("Token: ", tokenAddressOrMint);

          const tokenDerivative =
            await contract.tokenDerivatives(tokenAddressOrMint);
          return String(tokenDerivative);
        }

        case "Solana": {
          const rpcUrl = process.env.NEXT_PUBLIC_SOL_RPC_URL!;
          const connection = new Connection(rpcUrl, "confirmed");

          const mintPublicKey = new PublicKey(tokenAddressOrMint);

          const tokenDerivative = getDerivativeMint(mintPublicKey);

          const resp = await connection.getAccountInfo(tokenDerivative.pda);
          const lamports = resp?.lamports;
          if (!lamports) {
            throw new Error("Failed to fetch solana token derivative.");
          }

          return lamports > 0 ? tokenDerivative.pda.toString() : "";
        }

        default:
          throw new Error(`Unsupported chain: ${chain}`);
      }
    },
    ...options,
  });
}

function getDerivativeMint(mint: PublicKey): {
  pda: PublicKey;
  bump: number;
} {
  const twosideContract = envVariables.twosideContract.sol;
  if (twosideContract == "") {
    throw new Error("Twoside contract address not set.");
  }
  const twosideContractKey = new PublicKey(twosideContract);
  const [derivativeMintPDA, derivativeMintBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_mint"), mint.toBuffer()],
      twosideContractKey
    );

  return {
    pda: derivativeMintPDA,
    bump: derivativeMintBump,
  };
}
