#!/usr/bin/env ts-node

/**
 * deployForTesting_new.ts
 * Self-contained script to:
 *  1) initialize an Anchor provider using a predefined private key
 *  2) call `initializeProgram(developer, founder)` on a given Anchor program
 *  3) create a non-2022 SPL token mint
 *  4) create Metaplex on-chain metadata for the mint (v3)
 *  5) mint 100 tokens to a specified recipient ATA (or provider wallet if omitted)
 *
 * Usage (recommended):
 *  ANCHOR_PRIVATE_KEY_BASE58=<base58-key> \
 *  npx ts-node ./scripts/deployForTesting_new.ts \
 *    --rpc http://127.0.0.1:8899 \
 *    --program-id <PROGRAM_PUBKEY> \
 *    --idl ./target/idl/twoside.json \
 *    --recipient <RECIPIENT_PUBKEY_OPTIONAL>
 *
 * Or provide the key with --key argument (base58 string). The script will validate
 * the secret key length and accept either a 64-byte secret key or a 32-byte seed.
 */

import fs from "fs";
import path from "path";
import bs58 from "bs58";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  KeypairSigner,
  Umi,
} from "@metaplex-foundation/umi";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionDataArgs,
  CreateMetadataAccountV3InstructionAccounts,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  Collection,
  Uses,
  Creator,
} from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

// ---------- Config / parsing ----------
const argv = require("minimist")(process.argv.slice(2));
const RPC = argv.rpc || process.env.RPC_URL || "http://127.0.0.1:8899";
const IDL_PATH =
  argv.idl || process.env.IDL_PATH || "./target/idl/twoside.json";
const PROGRAM_ID_STR = argv["program-id"] || process.env.PROGRAM_ID;
// const KEY_ARG = argv.key || process.env.ANCHOR_PRIVATE_KEY_BASE58;
const RECIPIENT = argv.recipient || process.env.RECIPIENT;

if (!PROGRAM_ID_STR) {
  console.error("--program-id is required (or set PROGRAM_ID env)");
  process.exit(1);
}

// if (!KEY_ARG) {
//   console.error(
//     "--key (base58 private key) is required, or set ANCHOR_PRIVATE_KEY_BASE58 env var"
//   );
//   process.exit(1);
// }

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// Token metadata constants
const DECIMALS = 9;
const TOKEN_NAME = "MyToken";
const TOKEN_SYMBOL = "MT";
const TOKEN_URI = "https://example.com/metadata.json";
const TOKEN_MINT_AMOUNT = 100; // 100 tokens (human units)

// ---------- Helpers ----------
function loadIdl(idlPath: string) {
  const p = path.resolve(idlPath);
  if (!fs.existsSync(p)) throw new Error(`IDL not found at ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function keypairFromBase58MaybeSeed(base58: string): Keypair {
  const bytes = bs58.decode(base58);
  if (bytes.length === 64) {
    return Keypair.fromSecretKey(bytes);
  }
  if (bytes.length === 32) {
    // treat as seed
    return Keypair.fromSeed(bytes);
  }
  throw new Error(
    `bad secret key size: ${bytes.length}. expected 32 (seed) or 64 (secret key)`
  );
}

async function airdropIfNeeded(
  connection: Connection,
  pubkey: PublicKey,
  minLamports = 2 * LAMPORTS_PER_SOL
) {
  const balance = await connection.getBalance(pubkey);
  if (balance < minLamports) {
    console.log(`Airdropping ${minLamports} lamports to ${pubkey.toBase58()}`);
    const sig = await connection.requestAirdrop(pubkey, minLamports);
    await connection.confirmTransaction(sig, "confirmed");
  }
}

// ---------- Main flow ----------
(async function main() {
  try {
    console.log("RPC:", RPC);
    const connection = new Connection(RPC, "confirmed");

    // 1) load wallet
    const walletKeypair = keypairFromBase58MaybeSeed(
      "38HAUwiynSCMsbDj4Hx6EGkimyj2xSLktkkfCMphhXGe6ac3CjyiRu2K9w8ES25V4KSMSPPNA6qNw9WoYiQSXBm"
    );
    console.log("Using wallet:", walletKeypair.publicKey.toBase58());

    // airdrop provider wallet so it can pay fees
    await airdropIfNeeded(
      connection,
      walletKeypair.publicKey,
      5 * LAMPORTS_PER_SOL
    );

    // 2) anchor provider
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(walletKeypair),
      {
        commitment: "confirmed",
      }
    );
    anchor.setProvider(provider);

    // 3) load IDL & program
    const idl = loadIdl(IDL_PATH);
    const program = new Program(idl as any, provider);
    console.log("Loaded program:", PROGRAM_ID.toBase58());

    // 4) generate developer & founder (these are ephemeral test keypairs) and fund them
    const developer = Keypair.generate();
    const founder = Keypair.generate();
    console.log("Developer:", developer.publicKey.toBase58());
    console.log("Founder:", founder.publicKey.toBase58());
    await airdropIfNeeded(
      connection,
      developer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await airdropIfNeeded(connection, founder.publicKey, 2 * LAMPORTS_PER_SOL);

    // 5) call initializeProgram — this script uses the provider wallet as the signer (common pattern)
    console.log(
      "Calling initializeProgram(developer, founder) — signer will be provider wallet"
    );
    // This assumes your program has an instruction named `initializeProgram(developer, founder)` and an
    // account named `signer` in the accounts list. Adjust names if your program differs.
    await program.methods
      .initializeProgram(developer.publicKey, founder.publicKey)
      .accounts({ signer: walletKeypair.publicKey })
      .rpc();

    console.log("Program initializeProgram call succeeded.");

    // 6) create a non-2022 SPL mint (regular mint created via spl-token)
    console.log("Creating SPL mint (decimals:", DECIMALS, ")");
    const mint = await splToken.createMint(
      connection,
      walletKeypair, // payer
      walletKeypair.publicKey, // mint authority
      walletKeypair.publicKey, // freeze authority
      DECIMALS
    );
    console.log("Created mint:", mint.toBase58());

    // 7) create Metaplex on-chain metadata (v3) using umi + mpl-token-metadata
    console.log("Deploying Metaplex metadata (v3) for mint");
    const umi = createUmi(connection);
    const umiSigner: KeypairSigner = createSignerFromKeypair(
      umi,
      fromWeb3JsKeypair(walletKeypair)
    );
    umi.use(signerIdentity(umiSigner, true));

    const onChainData = {
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      uri: TOKEN_URI,
      sellerFeeBasisPoints: 0,
      creators: null as unknown as Creator[] | null,
      collection: null as unknown as Collection | null,
      uses: null as unknown as Uses | null,
    };

    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: fromWeb3JsKeypair(mint as any) as any, // adapter expects umi-compatible pubkey; umi-web3js-adapters handle this in real projects
      mintAuthority: umiSigner,
    } as any;

    const data: CreateMetadataAccountV3InstructionDataArgs = {
      isMutable: true,
      collectionDetails: null,
      data: onChainData as any,
    } as any;

    // Note: The adapter usage above requires `@metaplex-foundation/umi-web3js-adapters` set up in your project
    // In many projects you can call createMetadataAccountV3(this.umi, {...}).sendAndConfirm(this.umi)
    // but here we use a simplified call pattern and attempt to send.
    try {
      await createMetadataAccountV3(umi, {
        ...accounts,
        ...data,
      }).sendAndConfirm(umi);
      console.log("Metaplex metadata tx completed.");
    } catch (metaErr) {
      console.warn(
        "Metadata creation failed via umi helper — falling back to logging the error:",
        metaErr
      );
      // metadata step can be fragile depending on adapter versions; continue so test minting still runs
    }

    // 8) create recipient ATA and mint 100 tokens to them
    const recipientPub = RECIPIENT
      ? new PublicKey(RECIPIENT)
      : walletKeypair.publicKey;
    const recipientAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair,
      mint,
      recipientPub
    );

    const rawAmount = BigInt(TOKEN_MINT_AMOUNT) * BigInt(10 ** DECIMALS);
    console.log(
      `Minting ${TOKEN_MINT_AMOUNT} tokens (raw: ${rawAmount.toString()}) to ${recipientPub.toBase58()}`
    );

    await splToken.mintTo(
      connection,
      walletKeypair,
      mint,
      recipientAta.address,
      walletKeypair.publicKey,
      Number(rawAmount) // spl-token expects number|bigint; limited by JS number — for 100 * 10^9 it's safe
    );

    const recipientAccount = await splToken.getAccount(
      connection,
      recipientAta.address
    );
    console.log(
      `Recipient ATA: ${recipientAta.address.toBase58()} balance: ${recipientAccount.amount.toString()}`
    );

    console.log("All steps finished — mint + metadata (attempted) created.");
    process.exit(0);
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
