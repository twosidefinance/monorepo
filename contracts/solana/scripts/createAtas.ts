import * as splToken from "@solana/spl-token";
import { connection, developer, founder, tokenMint, user } from "./setup";

(async function main() {
  try {
    const userAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      tokenMint,
      user.publicKey
    );
    console.log("User ATA: ", userAta.address);
    console.log("");

    const developerAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      tokenMint,
      developer.publicKey
    );
    console.log("Developer ATA: ", developerAta.address);
    console.log("");

    const founderAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      tokenMint,
      founder
    );
    console.log("Founder ATA: ", founderAta.address);
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
