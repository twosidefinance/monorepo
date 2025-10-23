"use client";
import React, { useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { injected } from "wagmi/connectors";
import { Blockchain } from "@/types/global";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/store/global";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: true }
);

interface WalletContentProps {
  blockchain: Blockchain;
}

const formatWalletAddress = (address: string | null) => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
};

const WalletContent: React.FC<WalletContentProps> = ({
  blockchain,
}: WalletContentProps) => {
  const { connect } = useConnect();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { publicKey: solanaAddress, disconnect: disconnectSolana } =
    useWallet();
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);

  useEffect(() => {
    if (blockchain.id == "sol") {
      if (solanaAddress) {
        setCurrentUser({
          address: solanaAddress.toString(),
          loggedIn: true,
        });
      }
    } else {
      if (evmAddress) {
        setCurrentUser({
          address: evmAddress,
          loggedIn: true,
        });
      }
    }
  }, [evmAddress]);

  const handleNoWalletConnectAttempt = (blockchain: Blockchain) => {
    toast.error(`No ${blockchain.name} wallet found.`);
  };

  if (blockchain.id == "sol") {
    if (window != undefined && window.solana != undefined) {
      return solanaAddress && currentUser.loggedIn ? (
        <div className="flex items-center space-x-4">
          <div className="rounded-lg py-2 px-4 flex items-center">
            <span className="">Welcome, </span>
            <span className="ml-1">
              {solanaAddress.toString().slice(0, 6)}...
            </span>
            <WalletDisconnectButton />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-2 mb-2 lg:mb-0">
          <WalletMultiButtonDynamic />
          <WalletDisconnectButton />
        </div>
      );
    } else {
      return (
        <Button
          size="lg"
          onClick={() => handleNoWalletConnectAttempt(blockchain)}
          className="bg-black hover:bg-black text-primary-foreground 
                border-primary border-2 transition-all hover:scale-103
                font-bold text-lg px-8 cursor-pointer"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>
      );
    }
  }

  if (!isEvmConnected || !currentUser.loggedIn) {
    return (
      <Button
        size="lg"
        className="bg-black hover:bg-black text-primary-foreground 
                border-primary border-2 transition-all hover:scale-103
                font-bold text-lg px-8 cursor-pointer"
        onClick={() => {
          if (window != undefined && window.ethereum == undefined) {
            handleNoWalletConnectAttempt(blockchain);
          } else {
            connect({ connector: injected() });
          }
        }}
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <div className="rounded-lg py-2 px-4 flex items-center">
        <Badge
          variant="outline"
          className="flex items-center space-x-1 text-custom-primary-text w-32 p-2 rounded-lg"
        >
          <span>{formatWalletAddress(evmAddress!)}</span>
        </Badge>
      </div>
      <Button
        size="lg"
        className="bg-black hover:bg-black text-primary-foreground 
                border-primary border-2 transition-all hover:scale-103
                font-bold text-lg px-8 cursor-pointer"
        onClick={() =>
          blockchain.name === "Ethereum" ? disconnectEvm() : disconnectSolana()
        }
      >
        <LogOut className="h-4 w-4 mr-2" />
        Disconnect
      </Button>
    </div>
  );
};

export default WalletContent;
