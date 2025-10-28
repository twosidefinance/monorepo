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
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  currentUserAtom,
  selectedBlockchainAtom,
  selectedTokensAtom,
  tokenSelectorAtom,
} from "@/store/global";
import { placeholders } from "@/constants/placeholders";
import { TokenInfo } from "@uniswap/token-lists";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Blockchain } from "@/types/global";
import ThemedButton from "@/components/themed/button";
import { useTokenBalance } from "../hooks/query/tokens";
import { useTransactionDialog } from "../hooks/transactionDialogHook";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { envVariables } from "@/lib/envVariables";
import { useWriteContract } from "wagmi";
import erc20Abi from "../lib/evm/erc20.json";
import twosideAbi from "../lib/evm/twoside.json";
import { useTokenDerivative } from "../hooks/query/contract";
import {
  useAnchorProgram,
  useAnchorProgramWallets,
} from "../hooks/anchorProgram";
import { PublicKey } from "@solana/web3.js";
import { setup } from "../lib/sol/setup";
import * as anchor from "@coral-xyz/anchor";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

interface UnlockPanelProps {
  blockchain: Blockchain;
  fetchedTokens: TokenInfo[] | undefined;
}

export default function UnlockPanel({
  blockchain,
  fetchedTokens,
}: UnlockPanelProps) {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);
  const [useRawValues, setUseRawValues] = useState<boolean>(false);
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const [amount, setAmount] = useState<number>(
    useRawValues && selectedTokens.unlockToken[selectedBlockchain.id]?.decimals
      ? 1 *
          10 **
            (selectedTokens.unlockToken[selectedBlockchain.id]?.decimals ?? 0)
      : 1.0
  );
  const { writeContractAsync } = useWriteContract();
  const program = useAnchorProgram();
  const wallets = useAnchorProgramWallets();

  const defaultToken = useMemo(() => {
    return fetchedTokens && fetchedTokens.length > 1 ? fetchedTokens[1] : null;
  }, [fetchedTokens]);

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
    setSelectedTokens((prev) => ({
      ...prev,
      unlockToken: {
        ...prev.unlockToken,
        [selectedBlockchain.id]: token,
      },
    }));
    setTokenSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const displayToken = useMemo(() => {
    return selectedTokens.unlockToken[selectedBlockchain.id] || defaultToken;
  }, [selectedTokens.unlockToken, defaultToken]);

  const {
    data: tokenDerivativeData,
    isLoading: isTokenDerivativeLoading,
    error: tokenDerivativeError,
  } = useTokenDerivative({
    chain: selectedBlockchain,
    tokenAddressOrMint:
      selectedTokens.lockToken[selectedBlockchain.id]?.address ?? "",
  });

  const {
    data: tokenBalanceData,
    isLoading: isTokenBalanceLoading,
    error: tokenBalanceError,
  } = useTokenBalance({
    chain: selectedBlockchain,
    tokenAddressOrMint: tokenDerivativeData ?? "",
    userAddress: currentUser.address,
  });

  const { withConfirmation } = useTransactionDialog();

  const handleTokenApproval = async () => {
    if (!currentUser.loggedIn) {
      toast.error("Connect a wallet first.");
      return;
    }
    const tokenAddress =
      selectedTokens.lockToken[selectedBlockchain.id]?.address;
    if (!tokenAddress) {
      toast.error("Select a token and try again.");
      return;
    }
    if (amount == 0 || amount < 0) {
      toast.error("Invalid Amount Input");
      return;
    }
    const decimals = selectedTokens.lockToken[selectedBlockchain.id]?.decimals;
    let approvalAmount = amount;
    if (!useRawValues) {
      if (!decimals) {
        toast.error(
          "Token decimals not found, toggle to use raw values instead."
        );
        return;
      }
      approvalAmount = amount * decimals;
    }
    const twosideContract =
      selectedBlockchain.id == "eth"
        ? envVariables.twosideContract.eth
        : envVariables.twosideContract.base;
    if (twosideContract == "") {
      toast.error(
        `${selectedBlockchain.name} Twoside contract address not set.`
      );
      return;
    }
    const derivativeAddress = tokenDerivativeData;
    if (!derivativeAddress) {
      toast.error("Derivative address not found, try again.");
      return;
    }
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: derivativeAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [twosideContract, approvalAmount],
        });
        toast.success("Signature", {
          description: `${sig}`,
        });
      },
      {
        title: "Approve Tokens?",
        description: `Do you want to approve ${approvalAmount} ${selectedTokens.lockToken[selectedBlockchain.id]?.name.toString()}?`,
        successMessage: "Your tokens have been approved successfully.",
        loadingTitle: "Processing Transaction",
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      }
    );
  };

  const handleUnlockTokens = async () => {
    if (!currentUser.loggedIn) {
      toast.error("Connect a wallet first.");
      return;
    }
    const tokenAddress =
      selectedTokens.lockToken[selectedBlockchain.id]?.address;
    if (!tokenAddress) {
      toast.error("Select a token and try again.");
      return;
    }
    if (amount == 0 || amount < 0) {
      toast.error("Invalid Amount Input");
      return;
    }
    const decimals = selectedTokens.lockToken[selectedBlockchain.id]?.decimals;
    let unlockAmount = amount;
    if (!useRawValues) {
      if (!decimals) {
        toast.error(
          "Token decimals not found, toggle to use raw values instead."
        );
        return;
      }
      unlockAmount = amount * 10 ** decimals;
    }
    const twosideContract =
      selectedBlockchain.id == "eth"
        ? envVariables.twosideContract.eth
        : envVariables.twosideContract.base;
    if (twosideContract == "") {
      toast.error(
        `${selectedBlockchain.name} Twoside contract address not set.`
      );
      return;
    }
    const derivativeAddress = tokenDerivativeData;
    if (!derivativeAddress) {
      toast.error("Derivative address not found, try again.");
      return;
    }
    await withConfirmation(
      async () => {
        let sig;
        if (selectedBlockchain.id == "sol") {
          if (!program) {
            toast.error("Solana program not set, try again or reload.");
            return;
          }
          const tokenMint = new PublicKey(tokenAddress);
          const tokenMetadata = setup.getTokenMetadataPDA(tokenMint);
          const signer = new PublicKey(currentUser.address);
          const signerTokenAta = await setup.getTokenATA(tokenMint, signer);
          const founderWallet = wallets?.founder;
          const developerWallet = wallets?.developer;
          if (!developerWallet || !founderWallet) {
            toast.error("Error getting crucial accounts, reload & try again.");
            return;
          }
          sig = await program.methods
            .lock(new anchor.BN(unlockAmount))
            .accounts({
              tokenMint: tokenMint,
              tokenMetadata: tokenMetadata.pda,
              signer: signer,
              signerTokenAta: signerTokenAta,
              developerAta: wallets?.developer,
              founderAta: wallets?.founder,
              mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            })
            .rpc();
        } else {
          const sig = await writeContractAsync({
            address: twosideContract as `0x${string}`,
            abi: twosideAbi.abi,
            functionName: "unlock",
            args: [derivativeAddress, unlockAmount],
          });
          toast.success("Signature", {
            description: `${sig}`,
          });
        }
      },
      {
        title: "Unlock Tokens?",
        description: `Do you want to unlock ${unlockAmount} ${selectedTokens.lockToken[selectedBlockchain.id]?.name.toString()}?`,
        successMessage: "Your tokens have been unlocked successfully.",
        loadingTitle: "Processing Transaction",
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      }
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full md:w-112 rounded-2xl px-4 py-2">
        <div className="flex justify-between">
          <div className="text-xs text-custom-muted-text">You Unlock</div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger>
                {" "}
                <Label htmlFor="use-raw-values" className="text-xs">
                  Use Raw Values
                </Label>
              </TooltipTrigger>
              <TooltipContent className="w-60">
                <p>
                  Value you enter will interpreted as raw values. 10 would
                  interpreted as 10 tokens but now it would be interpreted as as
                  a raw value like 0.00...10.
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              className="shadow-none"
              id="use-raw-values"
              checked={useRawValues}
              onCheckedChange={(checked) => setUseRawValues(checked)}
            />
          </div>
        </div>
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
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
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
            {isTokenDerivativeLoading || isTokenBalanceLoading
              ? "Loading..."
              : tokenBalanceError
                ? "Not Found"
                : tokenBalanceData?.balance
                  ? "Unlockable: " +
                    tokenBalanceData?.balance +
                    " " +
                    (displayToken
                      ? displayToken.symbol
                      : placeholders.tokenSymbol)
                  : "Unlockable: Not Found"}
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
                      ? "li" + displayToken.symbol
                      : "li" + placeholders.tokenSymbol}
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
            receive li
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol}{" "}
            tokens that represent your locked position. Use li
            {displayToken ? displayToken.symbol : placeholders.tokenSymbol} in
            other DeFi protocols while earning rewards. Burn your li
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
              {`1 li${displayToken ? displayToken.symbol : placeholders.tokenSymbol} = 1 ${
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
      {selectedBlockchain.id == "sol" ? null : (
        <ThemedButton
          style="primary"
          variant="outline"
          size="lg"
          className="w-74 md:w-112 mt-2"
          onClick={handleTokenApproval}
        >
          <CircleCheck /> Approve Tokens
        </ThemedButton>
      )}
      <ThemedButton
        style="secondary"
        variant="outline"
        size="lg"
        className="w-74 md:w-112 mt-2"
        onClick={handleUnlockTokens}
      >
        <Unlock /> Unlock Tokens
      </ThemedButton>
    </div>
  );
}
