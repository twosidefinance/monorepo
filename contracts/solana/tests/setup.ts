import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { Buffcat } from "../target/types/buffcat";

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
