import { blockchains } from "@/constants/blockchains";
import { Blockchain, Language } from "../types/global";
import { TokenInfo } from "@uniswap/token-lists";
import { TokenSelectorAtom, SelectedTokensAtom, Tab } from "../types/state";
import { atom } from "jotai";
import { SupportedBlockchain } from "@/types/global";

export const currentUserAtom = atom<{
  address: string;
  loggedIn: boolean;
}>({
  address: "",
  loggedIn: false,
});

export const tokenSelectorAtom = atom<TokenSelectorAtom>({
  isOpen: false,
  onClose: () => {},
  onSelectToken: (token: TokenInfo) => {},
});

export const selectedTokensAtom = atom<SelectedTokensAtom>({
  lockToken: {
    eth: null,
    base: null,
    sol: null,
  },
  unlockToken: {
    eth: null,
    base: null,
    sol: null,
  },
});

export const currentTabAtom = atom<Tab>("lock");

export const selectedLanguageAtom = atom<Language>("english");

export const selectedBlockchainAtom = atom<Blockchain>(blockchains[0]);
