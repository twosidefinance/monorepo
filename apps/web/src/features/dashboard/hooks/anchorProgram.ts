import idl from "../lib/sol/idl.json";
import { Twoside } from "../lib/sol/twoside";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { setup } from "../lib/sol/setup";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function useAnchorProgram(): Program<Twoside> | null {
  const [program, setProgram] = useState<Program<Twoside> | null>(null);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    if (!wallet) {
      setProgram(null);
      return;
    }
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });
    setProgram(new Program<Twoside>(idl, provider));
  }, [connection, wallet]);

  return program;
}

export function useAnchorProgramWallets(): {
  founder: anchor.web3.PublicKey;
  developer: anchor.web3.PublicKey;
} | null {
  const [wallets, setWallets] = useState<{
    founder: anchor.web3.PublicKey;
    developer: anchor.web3.PublicKey;
  } | null>(null);
  const program = useAnchorProgram();

  useEffect(() => {
    if (!program) {
      setWallets(null);
      return;
    }
    const fetchGlobalInfo = async () => {
      const globalInfoAccount = await program.account.globalInfo.fetch(
        setup.globalInfoPDA
      );
      setWallets({
        founder: globalInfoAccount.founderWallet,
        developer: globalInfoAccount.developerWallet,
      });
    };
    fetchGlobalInfo();
  }, [program]);

  return wallets;
}

// export function useAnchorProgram2(): Program<Twoside> | null {
//   const { connection } = useConnection();
//   const wallet = useAnchorWallet();

//   if (!wallet) {
//     return null;
//   }

//   const provider = new AnchorProvider(connection, wallet, {
//     preflightCommitment: "processed",
//   });

//   const program = new Program<Twoside>(idl, provider);

//   return program;
// }

// export function useAnchorProgramWallets(): {
//   founder: anchor.web3.PublicKey;
//   developer: anchor.web3.PublicKey;
// } | null {
//   const program = useAnchorProgram();
//   if (!program) {
//     toast.error("Solana program not set, try again or reload.");
//     return null;
//   }
//   const globalInfoAccount = await program.account.globalInfo.fetch(
//     setup.globalInfoPDA
//   );
// }
