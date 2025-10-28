import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/idl.json";
import { Twoside } from "../target/types/twoside";
import { setup } from "../tests/setup";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import * as splToken from "@solana/spl-token";

const tokenMint = new PublicKey("731wQ2M1Z6B3T2gVYTNdhTWqzGPbVLQBzYYQGcDo7etk");
const tokenDecimals = 9;
const tokenMetaplexAccount = new PublicKey(
  "DSX6i4R3Ksj3xi1Xhzn2RCRPbRm1p5jgSgkf1T3qdCfd"
);

const programId = new PublicKey("AmsGvKEwUpj6ykJQFwYC9sLBwNuedcDx68ohkstW1ca6");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const secretKeySeed = [
  139, 158, 254, 32, 156, 51, 198, 209, 246, 164, 57, 247, 144, 224, 179, 6,
  249, 55, 148, 163, 244, 99, 64, 50, 232, 152, 180, 160, 23, 61, 166, 27, 138,
  224, 176, 158, 82, 80, 125, 219, 111, 72, 162, 193, 126, 225, 247, 225, 213,
  115, 124, 234, 47, 71, 197, 196, 245, 179, 113, 135, 108, 86, 240, 35,
];
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKeySeed));
const ata = new PublicKey("3bbwrKdY6NGEGYFw6WR6ALmdCqAXMCKXWvbjQn7K9iZr");

const developer = Keypair.fromSecretKey(
  bs58.decode(
    "4WUnGQLqQCnuHbQnG7PvGjnRZkvh4EgxxCbMDxZLVFB6oT16KQfJNbYkdGNV5nRNxLKBx6WXz1sdgG7rw2iPjnoF"
  )
);
const founder = new PublicKey("A2NgwpXFgKvQ9yKzt6eHvgefXT5VSD2kuRrwyVHaM9DW");

(async function main() {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(wallet)
    );
    const program = new anchor.Program<Twoside>(idl, provider);

    const [globalInfoPDA, globalInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.GLOBAL_INFO_STATIC_SEED],
        programId
      );

    const globalInfoAccount =
      await program.account.globalInfo.fetch(globalInfoPDA);

    console.log("Global Info Account :-");
    console.log(globalInfoAccount);
    console.log("");
    console.log("");

    const [tokenInfoPDA, tokenInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.TOKEN_INFO_STATIC_SEED, tokenMint.toBuffer()],
        programId
      );

    const tokenInfoAccount =
      await program.account.tokenInfo.fetch(tokenInfoPDA);

    console.log("Token Info Account :-");
    console.log(tokenInfoAccount);
    console.log("");
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
