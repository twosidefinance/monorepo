import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { Buffcat } from "../target/types/buffcat";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
export const connection = provider.connection;

export const program = anchor.workspace.Buffcat as Program<Buffcat>;
export const developer = anchor.web3.Keypair.generate();
export const founder = anchor.web3.Keypair.generate();
export const user = anchor.web3.Keypair.generate();

export const GLOBAL_INFO_STATIC_SEED = Buffer.from("global_info");
export const TOKEN_INFO_STATIC_SEED = Buffer.from("token_info");
export const VAULT_AUTHORITY_STATIC_SEED = Buffer.from("vault_authority");
export const AUTHORIZED_UPDATER_INFO_STATIC_SEED = Buffer.from(
  "authorized_updater_info"
);
export const METADATA_STATIC_SEED = Buffer.from("metadata");
export const DERIVATIVE_AUTHORITY_STATIC_SEED = Buffer.from(
  "derivative_authority"
);
export const DERIVATIVE_MINT_STATIC_SEED = Buffer.from("derivative_mint");

export const [globalInfoPDA, globalInfoBump] =
  anchor.web3.PublicKey.findProgramAddressSync(
    [GLOBAL_INFO_STATIC_SEED],
    program.programId
  );

export async function airdropToWallets() {
  const payerPubkey = provider.wallet.publicKey;
  const payerAirdropSig = await connection.requestAirdrop(
    payerPubkey,
    10 * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(payerAirdropSig, "confirmed");
  const payerBal = await connection.getBalance(payerPubkey);
  if (payerBal === 0)
    throw new Error("Airdrop failed: provider wallet has 0 lamports");
  const userAirdropSig = await connection.requestAirdrop(
    user.publicKey,
    10 * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(userAirdropSig, "confirmed");
  const developerAirdropSig = await connection.requestAirdrop(
    developer.publicKey,
    10 * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(developerAirdropSig, "confirmed");
  const founderAirdropSig = await connection.requestAirdrop(
    founder.publicKey,
    10 * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(founderAirdropSig, "confirmed");
}

export async function deployProgram() {
  await program.methods
    .initializeProgram(developer.publicKey, founder.publicKey)
    .accounts({
      signer: user.publicKey,
    })
    .signers([user])
    .rpc();
}

export const tokenDecimals = 6;

let tokenMint: PublicKey | null = null;
export async function getOrCreateTokenMint(): Promise<PublicKey> {
  if (tokenMint == null) {
    tokenMint = await splToken.createMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      tokenDecimals
    );
    return tokenMint;
  }
  return tokenMint;
}

export async function getOrCreateDerivativeMint(): Promise<PublicKey> {
  const tokenMint = await getOrCreateTokenMint();
  let [derivativeMintPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [DERIVATIVE_MINT_STATIC_SEED, tokenMint.toBuffer()],
    program.programId
  );
  return derivativeMintPDA;
}

let userTokenAta = null;
export async function getOrCreateUserTokenAta(): Promise<splToken.Account> {
  const tokenMint = await getOrCreateTokenMint();
  if (userTokenAta == null) {
    userTokenAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      tokenMint,
      user.publicKey
    );
    return userTokenAta;
  }
  return userTokenAta;
}

export async function getOrCreateUserDerivativeAta(): Promise<PublicKey> {
  const derivativeMint = await getOrCreateDerivativeMint();
  const [userDerivativeAta] = PublicKey.findProgramAddressSync(
    [
      user.publicKey.toBuffer(),
      splToken.TOKEN_PROGRAM_ID.toBuffer(),
      derivativeMint.toBuffer(),
    ],
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return userDerivativeAta;
}

let developerAta: splToken.Account | null = null;
let founderAta: splToken.Account | null = null;
export async function getOrCreateFounderAta(): Promise<splToken.Account> {
  const tokenMint = await getOrCreateTokenMint();
  if (founderAta == null) {
    founderAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      founder,
      tokenMint,
      founder.publicKey
    );
    return founderAta;
  }
  return founderAta;
}
export async function getOrCreateDeveloperAta(): Promise<splToken.Account> {
  const tokenMint = await getOrCreateTokenMint();
  if (developerAta == null) {
    developerAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      developer,
      tokenMint,
      developer.publicKey
    );
    return developerAta;
  }
  return developerAta;
}
