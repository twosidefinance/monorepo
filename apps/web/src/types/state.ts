import { TokenMetadata } from "@/types/global";

export type TokenSelectorAtom = {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenMetadata) => void;
};

export type SelectedTokensAtom = {
  lockToken: TokenMetadata | null;
  unlockToken: TokenMetadata | null;
};

export type Tab = "lock" | "unlock";
