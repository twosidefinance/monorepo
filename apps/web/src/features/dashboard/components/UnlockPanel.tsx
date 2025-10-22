import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Unlock,
  ArrowRightLeft,
  Settings,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useAtom, useSetAtom } from "jotai";
import { selectedTokensAtom, tokenSelectorAtom } from "@/store/global";
import { placeholders } from "@/constants/placeholders";
import { TokenInfo } from "@uniswap/token-lists";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Blockchain } from "@/types/global";
import ThemedButton from "@/components/themed/button";

interface UnlockPanelProps {
  blockchain: Blockchain;
  fetchedTokens: TokenInfo[] | undefined;
}

export default function UnlockPanel({
  blockchain,
  fetchedTokens,
}: UnlockPanelProps) {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

  const defaultToken = useMemo(() => {
    return fetchedTokens && fetchedTokens.length > 1 ? fetchedTokens[1] : null;
  }, [fetchedTokens]);

  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);

  const setTokenSelectorState = useSetAtom(tokenSelectorAtom);

  const handletokenSelectorTrigger = () => {
    setTokenSelectorState({
      isOpen: true,
      onClose: () =>
        setTokenSelectorState((prev) => ({ ...prev, isOpen: false })),
      onSelectToken: handleSelectToken,
    });
  };

  const handleSelectToken = (token: TokenInfo) => {
    setSelectedTokens((prev) => ({ ...prev, unlockToken: token }));
    setTokenSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const displayToken = useMemo(() => {
    return selectedTokens.unlockToken || defaultToken;
  }, [selectedTokens.unlockToken, defaultToken]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full md:w-112 rounded-2xl px-4 py-2">
        <div className="text-xs text-custom-muted-text">You Unlock</div>
        <div className="flex justify-between">
          {!fetchedTokens ? (
            <div className="w-36 h-12 me-6 mb-2 text-3xl font-bold text-left flex items-center">
              {placeholders.text}
            </div>
          ) : (
            <Button
              onClick={handletokenSelectorTrigger}
              variant="ghost"
              className="me-6 my-2 !py-6 !ps-0 hover:bg-custom-primary-color/20 cursor-pointer flex items-center"
            >
              <span>
                <ImageWithFallback
                  height={38}
                  width={38}
                  src={
                    displayToken?.logoURI
                      ? displayToken.logoURI
                      : placeholders.tokenImage
                  }
                  alt={
                    displayToken ? displayToken.name : placeholders.tokenName
                  }
                  fallbackSrc={placeholders.tokenImage}
                  // Add key to force re-render when token changes
                  key={displayToken?.address || "placeholder"}
                />
              </span>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-xl font-bold text-left text-custom-primary-text">
                    {displayToken
                      ? displayToken.symbol
                      : placeholders.tokenSymbol}
                  </span>
                  <span className="flex items-center">
                    <ChevronRight className="text-custom-primary-text" />
                  </span>
                </span>
                <span className="text-sm text-custom-muted-text">
                  on {blockchain.name}
                </span>
              </span>
            </Button>
          )}
          <div>
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="1.00"
              aria-label="amount"
              className="h-9 my-2 !text-3xl font-bold flex items-center shadow-none
              border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-transparent
              text-right placeholder:text-custom-primary-text p-0
              [&::-webkit-outer-spin-button]:appearance-none 
              [&::-webkit-inner-spin-button]:appearance-none 
              [-moz-appearance:textfield]"
            />
          </div>
        </div>
        <div className="flex justify-between">
          {
            <div className="text-sm text-custom-muted-text">
              {displayToken ? displayToken.name : placeholders.tokenName}
            </div>
          }

          <div className="text-sm text-custom-muted-text">
            {"Unlockable: 1.237 " +
              (displayToken ? displayToken.symbol : placeholders.tokenSymbol)}
          </div>
        </div>
      </div>
      <Collapsible className="w-full md:w-112 mt-2 rounded-2xl border border-custom-primary-color/30">
        <CollapsibleTrigger
          onClick={() => {
            setIsCollapsibleOpen((val) => !val);
          }}
          className="w-full py-2 px-4 flex justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>How it works</span>
          </div>
          <div className="flex items-center">
            {isCollapsibleOpen ? (
              <ChevronDown className="text-custom-muted-text" />
            ) : (
              <ChevronRight className="text-custom-muted-text" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-6">
          <div className="h-24 rounded-2xl grid grid-cols-3 px-18">
            <div className="flex flex-col items-center">
              <span>
                <ImageWithFallback
                  height={48}
                  width={48}
                  src={
                    displayToken?.logoURI
                      ? displayToken.logoURI
                      : placeholders.tokenImage
                  }
                  alt={
                    displayToken ? displayToken.name : placeholders.tokenName
                  }
                  fallbackSrc={placeholders.tokenImage}
                  // Add key to force re-render when token changes
                  key={displayToken?.address || "placeholder"}
                />
              </span>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-sm font-bold text-left text-custom-primary-text">
                    {displayToken
                      ? "b" + displayToken.symbol
                      : "b" + placeholders.tokenSymbol}
                  </span>
                </span>
              </span>
            </div>
            <div className="flex flex-col items-center">
              1:1
              <ArrowRightLeft className="h-8 w-8" />
            </div>
            <div className="flex flex-col items-center">
              <span>
                <ImageWithFallback
                  height={48}
                  width={48}
                  src={
                    displayToken?.logoURI
                      ? displayToken.logoURI
                      : placeholders.tokenImage
                  }
                  alt={
                    displayToken ? displayToken.name : placeholders.tokenName
                  }
                  fallbackSrc={placeholders.tokenImage}
                  // Add key to force re-render when token changes
                  key={displayToken?.address || "placeholder"}
                />
              </span>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-sm font-bold text-left text-custom-primary-text">
                    {displayToken
                      ? displayToken.symbol
                      : placeholders.tokenSymbol}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <div className="text-muted-foreground text-sm px-6 pb-4">
            Lock your{" "}
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol} and
            receive b
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol}{" "}
            tokens that represent your locked position. Use b
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol} in
            other DeFi protocols while earning rewards. Burn your b
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol}{" "}
            tokens to unlock your original{" "}
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol}. No
            lock-up period required.
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Card
        className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none
      border border-custom-primary-color/30"
      >
        <CardContent className="px-4">
          {
            <div>
              {`1 b${displayToken ? displayToken.symbol : placeholders.tokenSymbol} = 1 ${
                displayToken ? displayToken.symbol : placeholders.tokenSymbol
              }`}
            </div>
          }
          <div className="w-full md:w-104 flex justify-between">
            <div className="text-custom-muted-text">Platform Fee</div>
            <div>
              <span className="text-custom-muted-text">Auto </span>
              <span>0.5%</span>
            </div>
          </div>
          <div className="w-full md:w-104 flex justify-between">
            <div className="text-custom-muted-text">Gas Fee</div>
            <div>
              <span>Free</span>
              <span className="text-custom-muted-text line-through">
                {" "}
                $0.75
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <ThemedButton
        style="primary"
        variant="outline"
        size="lg"
        className="w-74 md:w-112 mt-2"
      >
        <CircleCheck /> Approve Tokens
      </ThemedButton>
      <ThemedButton
        style="secondary"
        variant="outline"
        size="lg"
        className="w-74 md:w-112 mt-2"
      >
        <Unlock /> Unlock Tokens
      </ThemedButton>
    </div>
  );
}
