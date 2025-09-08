export type SupportedBlockchain = "eth" | "base" | "solana";

export type Blockchain = {
  id: SupportedBlockchain;
  name: string;
  logoUrl: string;
  isSupported: boolean;
};

export type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  address: string;
};

export type Language =
  | "english"
  | "chinese"
  | "hindi"
  | "spanish"
  | "vietnamese"
  | "portuguese"
  | "korean"
  | "japanese"
  | "russian"
  | "french";

export type TextContent = {
  name: string;
};

export type Translations = {
  [key in Language]: TextContent;
};
