import { SupportedBlockchain } from "@/types/global";
import { TokenInfo, TokenList } from "@uniswap/token-lists";

export async function getTokensList(
  blockchain: SupportedBlockchain
): Promise<TokenInfo[]> {
  let tokensList = [];
  if (blockchain === "eth") {
    tokensList = await getEthereumTokensList();
  } else if (blockchain === "base") {
    tokensList = await getBaseTokensList();
  } else {
    tokensList = await getSolanaTokensList();
  }
  return tokensList;
}

export async function getEthereumTokensList() {
  const url =
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const list: TokenList = await res.json();
    return list.tokens;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getBaseTokensList() {
  const url =
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/tokenlist.json";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const list: TokenList = await res.json();
    return list.tokens;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export const solanaTokensList: TokenInfo[] = {
  chainId: 103, // Solana mainnet-beta (use 103 for devnet, 102 for testnet)
  address: "731wQ2M1Z6B3T2gVYTNdhTWqzGPbVLQBzYYQGcDo7etk",
  name: "My Token",
  symbol: "MT",
  decimals: 9,
  logoURI: "https://domain.com/example.json",
  tags: ["metaplex", "spl-token"],
  extensions: {
    metadata: {
      metaplex: {
        metadataAccount: "DSX6i4R3Ksj3xi1Xhzn2RCRPbRm1p5jgSgkf1T3qdCfd",
      },
      uri: "https://domain.com/example.json",
    },
  },
};

export async function getSolanaTokensList() {
  const url =
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/tokenlist.json";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const list: TokenList = await res.json();
    return list.tokens;
  } catch (error) {
    console.error(error);
    return [];
  }
}
