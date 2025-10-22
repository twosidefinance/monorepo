"use client";
import React from "react";
import { selectedBlockchainAtom } from "@/store/global";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

const WalletContent = dynamic(() => import("./WalletContent"), {
  ssr: false,
  loading: () => (
    <Button
      variant="outline"
      size="lg"
      className="cursor-none p-4 w-42 rounded-lg text-black"
      disabled
    >
      <Loader2Icon className="animate-spin text-black" />
      Please wait
    </Button>
  ),
});

export const UserWallet: React.FC = () => {
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);

  return <WalletContent blockchain={selectedBlockchain} />;
};
