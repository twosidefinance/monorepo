import React from "react";
import { typography } from "@/styles/typography";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { blockchains } from "@/constants/blockchains";
import { selectedBlockchainAtom } from "@/store/global";
import { useSetAtom } from "jotai";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserWallet } from "@/features/wallet/components/UserWallet";
import { Button } from "./ui/button";

const BlockchainSelector = () => {
  const setBlockchain = useSetAtom(selectedBlockchainAtom);

  return (
    <Select
      onValueChange={(val: string) => {
        const sel = blockchains.find((b) => String(b.id) === val);
        if (sel) setBlockchain(sel);
      }}
    >
      <SelectTrigger
        className="w-[180px] cursor-pointer shadow-none mb-4 lg:mb-0
                   border border-custom-primary-color rounded-2xl"
      >
        <SelectValue placeholder="Select a blockchain" />
      </SelectTrigger>
      <SelectContent className="bg-custom-root-bg">
        <SelectGroup>
          <SelectLabel>Blockchains</SelectLabel>
          {blockchains.map((b) => (
            <SelectItem
              key={b.id}
              value={String(b.id)}
              className="cursor-pointer"
            >
              {b.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const DappButton = () => {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Button
      size="lg"
      className="bg-black hover:bg-black text-primary-foreground 
                border-primary border-2 transition-all hover:scale-103
                font-bold text-lg px-8 cursor-pointer"
      onClick={() => {
        pathname == "/" ? router.push("/dashboard") : router.push("/");
      }}
    >
      <span className={typography.h4}>
        {pathname == "/" ? "Launch dApp" : "Go Home"}
      </span>
      <ChevronRight />
    </Button>
  );
};

export const Header: React.FC = () => {
  return (
    <>
      <div
        className="h-22 min-w-full border-[1px] border-gray-800 px-12 
            flex items-center justify-between bg-custom-root-bg"
      >
        <div className="flex items-center">
          <Image
            src="/twoside-bold.png"
            alt="Twoside Logo"
            height={56}
            width={56}
          />
          <Link className="no-underline ms-2" href={"/"}>
            <span className={typography.h1}>TWOSIDE</span>
          </Link>
        </div>
        <div className="items-center gap-2 hidden lg:flex">
          <BlockchainSelector />
          <UserWallet />
          <DappButton />
        </div>
        <div className="lg:hidden block">
          <Sheet>
            <SheetTrigger>
              <Menu />
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-left mb-6">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                <BlockchainSelector />
                <UserWallet />
                <DappButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};
