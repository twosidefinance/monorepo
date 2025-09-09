"use client";
import React, { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { SolanaProvider } from "@/features/wallet/config/solanaConfig";
import { wagmiConfig } from "@/features/wallet/config/wagmiConfig";
import { toast } from "sonner";

export function CustomLayout({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error("Something went wrong!", {
          description: `More Details: ${error.message}`,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error("Something went wrong!", {
          description: `More Details: ${error.message}`,
        });
      },
    }),
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SolanaProvider>{children}</SolanaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
