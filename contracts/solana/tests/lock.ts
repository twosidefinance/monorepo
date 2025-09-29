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
} from "./setup";
import { PublicKey } from "@solana/web3.js";
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
    assert(tokenAccount.decimals == tokenDecimals, "Wrong Token Decimals Set");
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
    const userDerivativeAta = await splToken.getAssociatedTokenAddressSync(
      derivativeMint.publicKey,
      user.publicKey
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

    // Lock tokens
    const lockAmount = 10 * 10 ** tokenDecimals;
    const tx = await program.methods
      .lock(new anchor.BN(lockAmount))
      .accounts({
        tokenMint: tokenMint,
        metadata: metadataPDA,
        derivativeMint: derivativeMint.publicKey,
        signer: user.publicKey,
        signerTokenAta: userTokenAta.address,
        signerDerivativeAta: userDerivativeAta,
        developerAta: developerAta.address,
        founderAta: founderAta.address,
      })
      .signers([user])
      .rpc();
    console.log("Lock TX:", tx);
  });
});
