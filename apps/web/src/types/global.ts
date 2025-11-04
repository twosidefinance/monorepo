export type SupportedBlockchain = "eth" | "base" | "sol";

export type Blockchain = {
  id: SupportedBlockchain;
  name: string;
  logoUrl: string;
  isSupported: boolean;
};

export type CoinGeckoTokenType = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};
