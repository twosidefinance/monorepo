import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { Twoside } from "../target/types/twoside";
import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/twoside.json";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export const connection = new Connection("http://127.0.0.1:8899", "confirmed");

export const secretKeySeed = [
  139, 158, 254, 32, 156, 51, 198, 209, 246, 164, 57, 247, 144, 224, 179, 6,
  249, 55, 148, 163, 244, 99, 64, 50, 232, 152, 180, 160, 23, 61, 166, 27, 138,
  224, 176, 158, 82, 80, 125, 219, 111, 72, 162, 193, 126, 225, 247, 225, 213,
  115, 124, 234, 47, 71, 197, 196, 245, 179, 113, 135, 108, 86, 240, 35,
];

export const tokenMint = new PublicKey(
  "HMCtny2coMmYL8uHSD14eR7cJyEcWNgJWMa65r1svmV2"
);

export const tokenDecimals = 9;

export const tokenMetaplexAccount = new PublicKey(
  "DSX6i4R3Ksj3xi1Xhzn2RCRPbRm1p5jgSgkf1T3qdCfd"
);

export const user = Keypair.fromSecretKey(Uint8Array.from(secretKeySeed));

export const userAta = getAssociatedTokenAddressSync(tokenMint, user.publicKey);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const programId = new PublicKey(
  "8Z48mrWoffcR3FoqAbcgE7fgRXBYV4zqLD5cMCD44d7f"
);

export const developer = Keypair.fromSecretKey(
  bs58.decode(
    "4WUnGQLqQCnuHbQnG7PvGjnRZkvh4EgxxCbMDxZLVFB6oT16KQfJNbYkdGNV5nRNxLKBx6WXz1sdgG7rw2iPjnoF"
  )
);

export const founder = new PublicKey(
  "A2NgwpXFgKvQ9yKzt6eHvgefXT5VSD2kuRrwyVHaM9DW"
);

export const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(user)
);

export const program = new anchor.Program<Twoside>(idl, provider);
