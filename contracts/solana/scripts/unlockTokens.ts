import * as anchor from "@coral-xyz/anchor";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import * as splToken from "@solana/spl-token";
import {
  tokenDecimals,
  tokenMetaplexAccount,
  tokenMint,
  user,
  program,
  userAta,
  developer,
  founder,
} from "./setup";
import { PublicKey } from "@solana/web3.js";

(async function main() {
  try {
    const developerAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      developer.publicKey
    );
    const founderAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      founder
    );

    const [tokenMetadataPDA, tokenMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );

    console.log("Unlocking Tokens :-");
    const lockAmount = 9 * 10 ** tokenDecimals;
    const sig = await program.methods
      .unlock(new anchor.BN(lockAmount))
      .accounts({
        tokenMint: tokenMint,
        signer: user.publicKey,
        signerTokenAta: userAta,
        developerAta: developerAta,
        founderAta: founderAta,
      })
      .signers([user])
      .rpc();
    console.log("Sig: ", sig);
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
