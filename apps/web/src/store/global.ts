import { blockchains } from "@/constants/blockchains";
import { Blockchain, CoinGeckoTokenType } from "../types/global";
import { TokenSelectorAtom, SelectedTokensAtom, Tab } from "../types/state";
import { atom } from "jotai";

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
  onSelectToken: (token: CoinGeckoTokenType) => {},
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

export const selectedBlockchainAtom = atom<Blockchain>(blockchains[0]);
