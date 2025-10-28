import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/idl.json";
import { Twoside } from "../target/types/twoside";
import { setup } from "../tests/setup";
import {
  deserializeMetadata,
  getDataV2Serializer,
  getMetadataAccountDataSerializer,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import * as splToken from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  RpcAccount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

const tokenMint = new PublicKey("Cz2Pf1MiHXAVNEXATjdNhzk9Fq4mfMN9a1xW7tJB6hz9");
const tokenDecimals = 9;
const tokenMetaplexAccount = new PublicKey(
  "DSX6i4R3Ksj3xi1Xhzn2RCRPbRm1p5jgSgkf1T3qdCfd"
);

const programId = new PublicKey("HXuJ9Xps35kYEHX1NRcACjUiurXUQKxcZhWffdBKyN6R");
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

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
    const umi = createUmi(connection);
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(wallet));
    umi.use(signerIdentity(umiSigner, true));

    const [tokenMetadataPDA, tokenMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          setup.METADATA_STATIC_SEED,
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );
    const tokenMetadataAccount = await umi.rpc.getAccount(
      fromWeb3JsPublicKey(tokenMetadataPDA)
    );
    const datav2 = getDataV2Serializer();
    const tokenMetadata = deserializeMetadata(
      tokenMetadataAccount as RpcAccount
    );
    console.log("Token Metadata :-");
    console.log(tokenMetadata);
    console.log("");
    console.log("");

    const program = new anchor.Program<Twoside>(idl, provider);

    const [tokenInfoPDA, tokenInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.TOKEN_INFO_STATIC_SEED, tokenMint.toBuffer()],
        programId
      );
    console.log("Token Info PDA: ", tokenInfoPDA);
    console.log("");
    console.log("");

    const [vaultAuthorityPDA, vaultAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.VAULT_AUTHORITY_STATIC_SEED, tokenMint.toBuffer()],
        programId
      );

    const [vaultAta, vaultAtaBump] = PublicKey.findProgramAddressSync(
      [
        vaultAuthorityPDA.toBuffer(),
        splToken.TOKEN_PROGRAM_ID.toBuffer(),
        tokenMint.toBuffer(),
      ],
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("Token Vault: ", vaultAta);
    console.log("Token Vualt Authority: ", vaultAuthorityPDA);
    console.log("");
    console.log("");

    const [derivativeMintPDA, derivativeMintBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.DERIVATIVE_MINT_STATIC_SEED, tokenMint.toBuffer()],
        programId
      );
    const [derivativeAuthorityPDA, derivativeAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.DERIVATIVE_AUTHORITY_STATIC_SEED, derivativeMintPDA.toBuffer()],
        programId
      );
    const [derivativeMetadataPDA, derivativeMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          setup.METADATA_STATIC_SEED,
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          derivativeMintPDA.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );
    console.log("Derivative Mint: ", derivativeMintPDA);
    console.log("Derivative Authority: ", derivativeAuthorityPDA);
    console.log("Derivative Metadata Account: ", derivativeMetadataPDA);
    console.log("");
    console.log("");

    const walletAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      tokenMint,
      wallet.publicKey
    );
    console.log("Wallet ATA: ", walletAta.address);
    console.log("");
    console.log("");

    const walletDerivativeAta = await splToken.getAssociatedTokenAddressSync(
      derivativeMintPDA,
      wallet.publicKey
    );
    console.log("Wallet Derivative ATA: ", walletAta.address);
    console.log("");
    console.log("");

    const developerAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      tokenMint,
      developer.publicKey
    );
    console.log("Developer ATA: ", developerAta.address);
    console.log("");
    console.log("");

    const founderAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      tokenMint,
      founder
    );
    console.log("Founder ATA: ", founderAta.address);
    console.log("");
    console.log("");

    const [globalInfoPDA, globalInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [setup.GLOBAL_INFO_STATIC_SEED],
        programId
      );
    console.log("Global Info PDA: ", globalInfoPDA);
    console.log("");
    console.log("");

    console.log("Locking Token :-");
    const lockAmount = 10 * 10 ** tokenDecimals;
    const sig = await program.methods
      .lock(new anchor.BN(lockAmount))
      .accounts({
        tokenMint: tokenMint,
        tokenMetadata: tokenMetaplexAccount,
        signer: wallet.publicKey,
        signerTokenAta: walletAta.address,
        developerAta: developerAta.address,
        founderAta: founderAta.address,
        mplTokenMetadataProgram: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        ),
      })
      .signers([wallet])
      .rpc();
    console.log("Sig: ", sig);
    console.log("");
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
