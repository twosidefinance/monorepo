"use client";
import React, { useEffect, useState } from "react";
import Dashboard from "@/features/dashboard/components/Dashboard";
import { useAtomValue } from "jotai";
import { TokenSelector } from "@/features/dashboard/components/TokenSelector";
import { tokenSelectorAtom } from "@/store/global";
import MobileAndTabletScreen from "@/components/MobileAndTabletScreen";

export default function DashboardPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024); // 1024px = laptop breakpoint
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const tokenSelectorStateValue = useAtomValue(tokenSelectorAtom);
  useEffect(() => {
    if (tokenSelectorStateValue.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [tokenSelectorStateValue]);

  if (!isDesktop) return <MobileAndTabletScreen />;

  return (
    <>
      <div className="container mx-auto min-h-screen flex items-center z-10">
        <Dashboard />
        <TokenSelector
          isOpen={tokenSelectorStateValue.isOpen}
          onClose={tokenSelectorStateValue.onClose}
          onSelectToken={tokenSelectorStateValue.onSelectToken}
        />
      </div>
    </>
  );
}
