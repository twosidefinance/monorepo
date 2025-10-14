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
  METADATA_STATIC_SEED,
  tokenDecimals,
  getOrCreateTokenMint,
  getOrCreateUserTokenAta,
  getOrCreateFounderAta,
  getOrCreateDeveloperAta,
  getOrCreateDerivativeMint,
  getOrCreateUserDerivativeAta,
} from "./setup";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  Collection,
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  Uses,
  getDataV2Serializer,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  none,
  RpcAccount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi-public-keys";

describe("Token Locking", () => {
  it("Normal Lock", async () => {
    try {
      const metadata = {
        name: "MyToken",
        symbol: "MT",
        uri: "https://example.com/metadata.json",
      };
      const tokenMint = await getOrCreateTokenMint();
      const tokenAccount = await splToken.getMint(connection, tokenMint);
      const derivativeMint = await getOrCreateDerivativeMint();

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

      const [tokenMetadataPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );

      const [derivativeMetadataPDA] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            METADATA_STATIC_SEED,
            new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
            derivativeMint.toBuffer(),
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

      const userTokenAta = await getOrCreateUserTokenAta();

      const [vaultAuthorityPDA, vaultAuthorityBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [VAULT_AUTHORITY_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );

      const [vaultAta] = PublicKey.findProgramAddressSync(
        [
          vaultAuthorityPDA.toBuffer(),
          splToken.TOKEN_PROGRAM_ID.toBuffer(),
          tokenMint.toBuffer(),
        ],
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID
      );
      let founderAta = await getOrCreateFounderAta();
      let developerAta = await getOrCreateDeveloperAta();

      const initialBalance = 100 * 10 ** tokenDecimals;
      await splToken.mintTo(
        connection,
        user,
        tokenMint,
        userTokenAta.address,
        user.publicKey,
        initialBalance
      );

      let userTokenAtaAccount = await splToken.getAccount(
        connection,
        userTokenAta.address
      );

      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance),
        "Wrong User Token Balance"
      );

      await program.methods
        .addAuthorizedUpdater(user.publicKey)
        .accounts({
          signer: founder.publicKey,
        })
        .signers([founder])
        .rpc();

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

      await program.methods
        .whitelist()
        .accounts({
          tokenMint: tokenMint,
          signer: user.publicKey,
        })
        .signers([user])
        .rpc();

      const [tokenInfoPDA, tokenInfoBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [TOKEN_INFO_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );

      const tokenInfo = await program.account.tokenInfo.fetch(tokenInfoPDA);

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

      const [derivativeAuthorityPDA, derivativeAuthorityBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [DERIVATIVE_AUTHORITY_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );

      const lockAmount = 10 * 10 ** tokenDecimals;
      const tx = await program.methods
        .lock(new anchor.BN(lockAmount))
        .accounts({
          tokenMint: tokenMint,
          tokenMetadata: tokenMetadataPDA,
          signer: user.publicKey,
          signerTokenAta: userTokenAta.address,
          developerAta: developerAta.address,
          founderAta: founderAta.address,
          mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      const [derivativeMintPDA, derivativeMintBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [DERIVATIVE_MINT_STATIC_SEED, tokenMint.toBuffer()],
          program.programId
        );
      const derivativeMintAccount = await splToken.getMint(
        connection,
        derivativeMintPDA
      );

      assert(
        derivativeMintAccount.isInitialized == true,
        "Derivative Mint Not Initialized"
      );
      assert(
        derivativeMintAccount.decimals == tokenDecimals,
        "Wrong Derivative Token Decimals"
      );
      assert(
        derivativeMintAccount.mintAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "Wrong Derivative Mint Authority"
      );
      assert(
        derivativeMintAccount.freezeAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "Wrong Derivative Freeze Authority"
      );
      assert(
        derivativeMintAccount.supply.toString() ==
          BigInt(lockAmount * 0.995).toString(),
        "Wrong Derivative Total Supply"
      );

      const feeShare = (lockAmount * 5) / 2000;

      developerAta = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        developer,
        tokenMint,
        developer.publicKey
      );
      assert(
        developerAta.amount == BigInt(feeShare),
        "Wrong Developer ATA Balance"
      );

      founderAta = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        founder,
        tokenMint,
        founder.publicKey
      );
      assert(
        founderAta.amount == BigInt(feeShare),
        "Wrong Developer ATA Balance"
      );

      const derivativeMetadataAccount = await umi.rpc.getAccount(
        fromWeb3JsPublicKey(derivativeMetadataPDA)
      );
      const datav2 = getDataV2Serializer();
      const derivativeMetadata = deserializeMetadata(
        derivativeMetadataAccount as RpcAccount
      );

      const derivativeName: string = "Liquid " + metadata.name;
      const derivativeSymbol: string = "li" + metadata.symbol;

      assert(
        derivativeMetadata.name.toString() == derivativeName,
        "Wrong Derivative Name"
      );
      assert(
        derivativeMetadata.symbol.toString() == derivativeSymbol,
        "Wrong Derivative Symbol"
      );
      assert(
        derivativeMetadata.uri.toString() == metadata.uri,
        "Wrong Derivative URI"
      );

      const tokenMintAccount = await splToken.getMint(connection, tokenMint);

      assert(
        tokenMintAccount.isInitialized == true,
        "Token Mint Not Initialized"
      );
      assert(
        tokenMintAccount.decimals == tokenDecimals,
        "Wrong Token Decimals"
      );
      assert(
        tokenMintAccount.mintAuthority.toString() == user.publicKey.toString(),
        "Wrong Token Mint Authority"
      );
      assert(
        tokenMintAccount.freezeAuthority.toString() ==
          user.publicKey.toString(),
        "Wrong Token Freeze Authority"
      );
      assert(
        tokenMintAccount.supply.toString() == BigInt(initialBalance).toString(),
        "Wrong Token Total Supply"
      );

      userTokenAtaAccount = await splToken.getAccount(
        connection,
        userTokenAta.address
      );
      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance - lockAmount),
        "Wrong User ATA Balance 2"
      );

      const userDerivativeAta = await getOrCreateUserDerivativeAta();
      const userDerivativeAtaAccount = await splToken.getAccount(
        connection,
        userDerivativeAta
      );
      assert(
        userDerivativeAtaAccount.mint.toString() == derivativeMint.toString(),
        "Wrong User Derivative ATA Mint"
      );
      assert(
        userDerivativeAtaAccount.amount == BigInt(lockAmount * 0.995),
        "Wrong User Derivative ATA Balance 2"
      );

      const vaultAtaAccount = await splToken.getAccount(connection, vaultAta);
      assert(
        vaultAtaAccount.mint.toString() == tokenMint.toString(),
        "Wrong Vault ATA Mint"
      );
      assert(
        vaultAtaAccount.amount == BigInt(lockAmount - feeShare * 2),
        "Wrong Vault ATA Balance"
      );
    } catch (err: any) {
      console.error("Caught error:", err);

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
