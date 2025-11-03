import { SupportedBlockchain } from "@/types/global";
import { Token } from "@coinbase/onchainkit/token";
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

// export async function getBaseTokensList(page: number) {
//   try {
//     const res = await fetch(`/api/base-list/${page}`);
//     if (!res.ok) {
//       return [];
//     }
//     const list: Token = await res.json();
//     return list;
//   } catch (error) {
//     console.error(error);
//     return [];
//   }
// }

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
