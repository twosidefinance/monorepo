import { Language, TokenMetadata } from "../types/global";
import { TokenSelectorAtom, SelectedTokensAtom, Tab } from "../types/state";
import { atom } from "jotai";

export const tokenSelectorAtom = atom<TokenSelectorAtom>({
  isOpen: false,
  onClose: () => {},
  onSelectToken: (token: TokenMetadata) => {},
});

export const selectedTokensAtom = atom<SelectedTokensAtom>({
  lockToken: null,
  unlockToken: null,
});

export const currentTabAtom = atom<Tab>("lock");

export const selectedLanguageAtom = atom<Language>("english");
