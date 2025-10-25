import { Blockchain, SupportedBlockchain } from "@/types/global";
import { cacheAllTokens, getCachedAllTokens } from "../../lib/cache/tokens";
import { TokenInfo } from "@uniswap/token-lists";
import { getTokensList } from "../../services/query/tokens";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ethers } from "ethers";
import { Connection, PublicKey } from "@solana/web3.js";

export function useAllTokensList(blockchain: SupportedBlockchain) {
  return useQuery<TokenInfo[] | undefined>({
    queryKey: [`allTokensList_for_${blockchain}`, blockchain],
    queryFn: async () => {
      const cachedData = getCachedAllTokens(blockchain);
      if (cachedData.isCached && cachedData.lockTokens)
        return cachedData.lockTokens;
      const tokens = await getTokensList(blockchain);
      cacheAllTokens(tokens, blockchain);
      return tokens;
    },
  });
}

interface UseTokenBalanceParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
  userAddress: string;
}

interface TokenBalanceResult {
  balance: number;
  raw: string;
  decimals: number;
}

export function useTokenBalance(
  { chain, tokenAddressOrMint, userAddress }: UseTokenBalanceParams,
  options?: UseQueryOptions<TokenBalanceResult, Error>
) {
  return useQuery<TokenBalanceResult, Error>({
    queryKey: ["tokenBalance", chain, tokenAddressOrMint, userAddress],
    enabled: !!chain && !!tokenAddressOrMint && !!userAddress,
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

          const tokenContractAddress = tokenAddressOrMint;
          const user = userAddress;
          const abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
          ];
          const contract = new ethers.Contract(
            tokenContractAddress,
            abi,
            provider
          );

          const [rawBalance, decimals] = await Promise.all([
            contract.balanceOf(user),
            contract.decimals(),
          ]);
          const formatted = Number(ethers.formatUnits(rawBalance, decimals));
          return {
            balance: formatted,
            raw: rawBalance.toString(),
            decimals,
          };
        }

        case "Solana": {
          const rpcUrl = process.env.NEXT_PUBLIC_SOL_RPC_URL!;
          const connection = new Connection(rpcUrl, "confirmed");

          const mintPublicKey = new PublicKey(tokenAddressOrMint);
          const ownerPublicKey = new PublicKey(userAddress);

          const associatedTokenAccount = await PublicKey.findProgramAddress(
            [
              ownerPublicKey.toBuffer(),
              new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
              ).toBuffer(),
              mintPublicKey.toBuffer(),
            ],
            new PublicKey("ATokenGPvoter…")
          );
          const tokenAccountPubkey = associatedTokenAccount[0];

          const resp =
            await connection.getTokenAccountBalance(tokenAccountPubkey);
          const decimals = resp.value.decimals;
          const raw = resp.value.amount;
          const formatted = Number(resp.value.uiAmount ?? 0);

          return {
            balance: formatted,
            raw,
            decimals,
          };
        }

        default:
          throw new Error(`Unsupported chain: ${chain}`);
      }
    },
    ...options,
  });
}
