import { TokenInfo } from "@uniswap/token-lists";
import { SupportedBlockchain } from "./global";

export type TokenSelectorAtom = {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenInfo) => void;
};

export type SelectedTokensAtom = {
  lockToken: {
    [key in SupportedBlockchain]: TokenInfo | null;
  };
  unlockToken: {
    [key in SupportedBlockchain]: TokenInfo | null;
  };
};

export type Tab = "lock" | "unlock";
