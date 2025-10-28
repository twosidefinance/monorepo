import { assert } from "chai";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  deserializeMetadata,
  getDataV2Serializer,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { fetchLogsFromSignature, setup } from "./setup";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { RpcAccount } from "@metaplex-foundation/umi";

export const tokenIndex = 0;
export const tokenDecimals = 9;
export const tokenMetadata = {
  name: "MyToken",
  symbol: "MT",
  uri: "https://example.com/metadata.json",
};

export const initialBalance = 100 * 10 ** tokenDecimals;
export const lockAmount = 10 * 10 ** tokenDecimals;

describe("Token Locking", () => {
  it("Normal Lock", async () => {
    try {
      const tokenMint = await setup.generateTokenMint(tokenDecimals);
      const tokenAccount = await splToken.getMint(setup.connection, tokenMint);
      const { pda: derivativeMint, bump: derivativeMintBump } =
        setup.getDerivativeMint(tokenMint);

      assert(tokenAccount.isInitialized == true, "Token Mint Not Initialized");
      assert(
        tokenAccount.decimals == tokenDecimals,
        "Wrong Token Decimals Set"
      );
      assert(
        tokenAccount.mintAuthority.toString() ==
          setup.payer.publicKey.toString(),
        "Wrong Mint Authority Set"
      );
      assert(
        tokenAccount.freezeAuthority.toString() ==
          setup.payer.publicKey.toString(),
        "Wrong Freeze Authority Set"
      );
      assert(tokenAccount.supply == BigInt(0), "Wrong Token Supply");

      const { pda: tokenMetadataPDA, bump: tokenMetadataBump } =
        setup.getTokenMetadataPDA(tokenMint);
      const { pda: derivativeMetadataPDA, bump: derivativeMetadataBump } =
        setup.getTokenMetadataPDA(derivativeMint);

      await setup.deployMetaplexMetadata(
        tokenMetadata.name,
        tokenMetadata.symbol,
        tokenMetadata.uri,
        tokenMint
      );

      const userTokenAta = await setup.getTokenATA(
        tokenMint,
        setup.user.publicKey
      );

      const {
        authority: vaultAuthorityPDA,
        authorityBump: vaultAuthorityBump,
        ata: vaultAtaPDA,
        ataBump: vaultAtaBump,
      } = setup.getTokenVault(tokenMint);

      let founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey
      );
      let developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey
      );

      await splToken.mintTo(
        setup.connection,
        setup.payer,
        tokenMint,
        userTokenAta.address,
        setup.payer.publicKey,
        initialBalance
      );

      let userTokenAtaAccount = await splToken.getAccount(
        setup.connection,
        userTokenAta.address
      );

      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance),
        "Wrong User Token Balance"
      );

      const { pda: derivativeAuthorityPDA, bump: derivativeAuthorityBump } =
        setup.getDerivativeAuthority(tokenMint);

      const tx = await setup.program.methods
        .lock(new anchor.BN(lockAmount))
        .accounts({
          tokenMint: tokenMint,
          tokenMetadata: tokenMetadataPDA,
          signer: setup.user.publicKey,
          signerTokenAta: userTokenAta.address,
          developerAta: developerAta.address,
          founderAta: founderAta.address,
          mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([setup.user])
        .rpc();

      const { pda: tokenInfoPDA, bump: tokenInfoBump } =
        setup.getTokenInfoPDA(tokenMint);

      const tokenInfo =
        await setup.program.account.tokenInfo.fetch(tokenInfoPDA);

      assert(tokenInfo.isInitialized, "Token Info Not Initialized");
      assert(
        tokenInfo.originalMint.toString() == tokenMint.toString(),
        "Wrong Token Mint Set"
      );
      assert(
        tokenInfo.derivativeMint.toString() == derivativeMint.toString(),
        "Wrong Derivative Mint Set"
      );

      const derivativeMintAccount = await splToken.getMint(
        setup.connection,
        derivativeMint
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

      developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey
      );
      assert(
        developerAta.amount == BigInt(feeShare),
        "Wrong Developer ATA Balance"
      );

      founderAta = await setup.getTokenATA(tokenMint, setup.founder.publicKey);
      assert(
        founderAta.amount == BigInt(feeShare),
        "Wrong Developer ATA Balance"
      );

      const derivativeMetadataAccount = await setup.umi.rpc.getAccount(
        fromWeb3JsPublicKey(derivativeMetadataPDA)
      );
      const datav2 = getDataV2Serializer();
      const derivativeMetadata = deserializeMetadata(
        derivativeMetadataAccount as RpcAccount
      );

      const derivativeName = setup.getDerivativeName(tokenMetadata.name);
      const derivativeSymbol = setup.getDerivativeSymbol(tokenMetadata.symbol);

      assert(
        derivativeMetadata.name.toString() == derivativeName,
        "Wrong Derivative Name"
      );
      assert(
        derivativeMetadata.symbol.toString() == derivativeSymbol,
        "Wrong Derivative Symbol"
      );
      assert(
        derivativeMetadata.uri.toString() == tokenMetadata.uri,
        "Wrong Derivative URI"
      );
      assert(
        derivativeMetadata.mint.toString() == derivativeMint.toString(),
        "Wrong Derivative Metadata Mint"
      );

      const tokenMintAccount = await splToken.getMint(
        setup.connection,
        tokenMint
      );

      assert(
        tokenMintAccount.isInitialized == true,
        "Token Mint Not Initialized"
      );
      assert(
        tokenMintAccount.decimals == tokenDecimals,
        "Wrong Token Decimals"
      );
      assert(
        tokenMintAccount.mintAuthority.toString() ==
          setup.payer.publicKey.toString(),
        "Wrong Token Mint Authority"
      );
      assert(
        tokenMintAccount.freezeAuthority.toString() ==
          setup.payer.publicKey.toString(),
        "Wrong Token Freeze Authority"
      );
      assert(
        tokenMintAccount.supply.toString() == BigInt(initialBalance).toString(),
        "Wrong Token Total Supply"
      );

      userTokenAtaAccount = await splToken.getAccount(
        setup.connection,
        userTokenAta.address
      );
      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance - lockAmount),
        "Wrong User ATA Balance 2"
      );

      const userDerivativeAta = setup.getDerivativeATA(
        derivativeMint,
        setup.user.publicKey
      );
      const userDerivativeAtaAccount = await splToken.getAccount(
        setup.connection,
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

      const vaultAtaAccount = await splToken.getAccount(
        setup.connection,
        vaultAtaPDA
      );
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
          setup.program.provider.connection,
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
