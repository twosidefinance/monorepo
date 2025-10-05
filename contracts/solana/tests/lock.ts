import { assert } from "chai";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import {
  connection,
  program,
  user,
  developer,
  founder,
  globalInfoPDA,
  TOKEN_INFO_STATIC_SEED,
  AUTHORIZED_UPDATER_INFO_STATIC_SEED,
  VAULT_AUTHORITY_STATIC_SEED,
  DERIVATIVE_AUTHORITY_STATIC_SEED,
  DERIVATIVE_MINT_STATIC_SEED,
} from "./setup";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import {
  Collection,
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  Uses,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  none,
  signerIdentity,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

describe("Token Locking", () => {
  it("Normal Lock", async () => {
    try {
      // Create a token mint
      const metadata = {
        name: "MyToken",
        symbol: "MT",
        uri: "https://example.com/metadata.json",
      };
      const tokenDecimals = 9;

      const tokenMint = await splToken.createMint(
        connection,
        user,
        user.publicKey,
        user.publicKey,
        tokenDecimals
      );
      const tokenAccount = await splToken.getMint(connection, tokenMint);

      assert(tokenAccount.isInitialized == true, "Token Mint Not Initialized");
      assert(
        tokenAccount.decimals == tokenDecimals,
        "Wrong Token Decimals Set"
      );
      assert(
        tokenAccount.mintAuthority.toString() == user.publicKey.toString(),
        "Wrong Mint Authority Set"
      );
      assert(
        tokenAccount.freezeAuthority.toString() == user.publicKey.toString(),
        "Wrong Freeze Authority Set"
      );
      assert(tokenAccount.supply == BigInt(0), "Wrong Token Supply");

      const derivativeMint = anchor.web3.Keypair.generate();

      // Create the metadata account
      const [metadataPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );

      const umi = createUmi(connection);
      const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(user));
      umi.use(signerIdentity(umiSigner, true));

      const onChainData = {
        ...metadata,
        sellerFeeBasisPoints: 0,
        creators: none<Creator[]>(),
        collection: none<Collection>(),
        uses: none<Uses>(),
      };
      const accounts: CreateMetadataAccountV3InstructionAccounts = {
        mint: fromWeb3JsPublicKey(tokenMint),
        mintAuthority: umiSigner,
      };
      const data: CreateMetadataAccountV3InstructionDataArgs = {
        isMutable: true,
        collectionDetails: null,
        data: onChainData,
      };
      const txid = await createMetadataAccountV3(umi, {
        ...accounts,
        ...data,
      }).sendAndConfirm(umi);
      console.log(txid);

      // Make ATAs
      const userTokenAta = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        user,
        tokenMint,
        user.publicKey
      );
      // explicit canonical ATA derivation -- unambiguous
      const [userDerivativeAta] = PublicKey.findProgramAddressSync(
        [
          user.publicKey.toBuffer(), // owner
          splToken.TOKEN_PROGRAM_ID.toBuffer(), // spl-token program id
          derivativeMint.publicKey.toBuffer(), // mint
        ],
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID // associated token program id
      );
      console.log("explicit derived ATA:", userDerivativeAta.toString());
      console.log(
        "client derived userDerivativeAta (toString):",
        userDerivativeAta.toString()
      );
      console.log(
        "client derived userDerivativeAta (constructor):",
        userDerivativeAta.constructor.name
      );
      console.log("token program: ", splToken.TOKEN_PROGRAM_ID);
      console.log(
        "associated token program: ",
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const developerAta = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        developer,
        tokenMint,
        developer.publicKey
      );
      const founderAta = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        founder,
        tokenMint,
        founder.publicKey
      );

      // Mint tokens to user
      const initialBalance = 100 * 10 ** tokenDecimals;
      await splToken.mintTo(
        connection,
        user,
        tokenMint,
        userTokenAta.address,
        user.publicKey,
        initialBalance
      );

      const userTokenAtaAccount = await splToken.getAccount(
        connection,
        userTokenAta.address
      );

      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance),
        "Wrong User Token Balance"
      );

      // Add a authorized updater
      await program.methods
        .addAuthorizedUpdater(user.publicKey)
        .accounts({
          signer: founder.publicKey,
        })
        .signers([founder])
        .rpc();

      // Derive PDAs
      const [authorizedUpdaterPDA, authorizedUpdaterBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [AUTHORIZED_UPDATER_INFO_STATIC_SEED, user.publicKey.toBuffer()],
          program.programId
        );

      const authorizedUpdaterInfo =
        await program.account.authorizedUpdaterInfo.fetch(authorizedUpdaterPDA);

      assert(
        authorizedUpdaterInfo.active == true,
        "Authorized Updater Not Active"
      );
      assert(
        authorizedUpdaterInfo.key.toString() == user.publicKey.toString(),
        "Wrong Authorized Updater Key Set"
      );

      // Whitelist a token
      await program.methods
        .whitelist()
        .accounts({
          tokenMint: tokenMint,
          signer: user.publicKey,
        })
        .signers([user])
        .rpc();

      // Derive PDAs
      const [tokenInfoPDA, tokenInfoBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [TOKEN_INFO_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );

      const tokenInfo = await program.account.tokenInfo.fetch(tokenInfoPDA);

      const [vaultAuthorityPDA, vaultAuthorityBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [VAULT_AUTHORITY_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );

      assert(
        tokenInfo.originalMint.toString() == tokenMint.toString(),
        "Wrong Token Mint Set"
      );
      assert(
        tokenInfo.derivativeMint.toString() == PublicKey.default.toString(),
        "Wrong Derivative Mint Set"
      );
      assert(tokenInfo.whitelisted == true, "Token Not Whitelisted");
      assert(
        tokenInfo.vaultAuthorityBump == vaultAuthorityBump,
        "Wrong Vault Authority Bump Set"
      );

      console.log(
        "MPL_TOKEN_METADATA_PROGRAM_ID: ",
        MPL_TOKEN_METADATA_PROGRAM_ID
      );

      console.log("");

      console.log("Token Mint: ", tokenMint.toString());
      console.log("Token Metadata: ", metadata);
      console.log("Token Derivative: ", derivativeMint.publicKey);

      const [derivativeAuthorityPDA, derivativeAuthorityBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [DERIVATIVE_AUTHORITY_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );
      console.log(
        "Token Derivative Authority: ",
        derivativeAuthorityPDA.toString()
      );

      console.log("");

      console.log("Signer: ", user.publicKey.toString());
      console.log("Signer Token ATA: ", userTokenAta.address.toString());
      console.log(
        "Signer Token Derivative ATA: ",
        userDerivativeAta.toString()
      );

      console.log("");

      console.log("Developer Token ATA: ", developerAta.address.toString());
      console.log("Founder Token ATA: ", founderAta.address.toString());

      // Lock tokens
      const lockAmount = 10 * 10 ** tokenDecimals;
      const tx = await program.methods
        .lock(new anchor.BN(lockAmount))
        .accounts({
          tokenMint: tokenMint,
          tokenMetadata: metadataPDA,
          signer: user.publicKey,
          signerTokenAta: userTokenAta.address,
          developerAta: developerAta.address,
          founderAta: founderAta.address,
          mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([user, derivativeMint])
        .rpc();
      console.log("Lock TX:", tx);

      // Derive derivative mint and check if token decimals
      const [derivativeMintPDA, derivativeMintBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [DERIVATIVE_MINT_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );
      const derivativeMintAccount = await splToken.getMint(
        connection,
        derivativeMintPDA
      );
      // are equal to token mint decimals
      assert(
        derivativeMintAccount.decimals == tokenDecimals,
        "Wrong Token Decimals"
      );
      assert(
        derivativeMintAccount.mintAuthority == derivativeAuthorityPDA,
        "Wrong Mint Authority"
      );
      assert(
        derivativeMintAccount.freezeAuthority == derivativeAuthorityPDA,
        "Wrong Freeze Authority"
      );
      // check supply has increased
      assert(
        derivativeMintAccount.supply == BigInt(lockAmount * 0.95),
        "Wrong Total Supply"
      );
    } catch (err: any) {
      console.error("Caught error:", err);

      // If the error has a signature (often err.signature or err.logs or err.txSig)
      const signature =
        err?.signature ?? err?.txSig ?? err?.transactionSignature;
      if (typeof signature === "string") {
        const logs = await fetchLogsFromSignature(
          program.provider.connection,
          signature
        );
        console.log("Transaction logs:", logs);
      } else {
        console.log(
          "No signature found in error object; cannot fetch logs by signature"
        );
      }

      // Rethrow or assert specific error conditions if you want
      // e.g. assert(err.message.includes("Some custom failure condition"));
    }
  });
});

async function fetchLogsFromSignature(
  connection: Connection,
  signature: string,
  commitment: anchor.web3.Finality = "confirmed"
): Promise<string[] | null> {
  const tx = await connection.getTransaction(signature, { commitment });
  if (tx && tx.meta && tx.meta.logMessages) {
    return tx.meta.logMessages;
  }
  return null;
}
