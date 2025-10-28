import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import idl from "./idl.json";
import { Twoside } from "./twoside";
import * as splToken from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey } from "@solana/web3.js";

class Setup {
  private static instance: Setup | null = null;

  public GLOBAL_INFO_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("global_info");
  public TOKEN_INFO_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("token_info");
  public VAULT_AUTHORITY_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("vault_authority");
  public AUTHORIZED_UPDATER_INFO_STATIC_SEED: Buffer<ArrayBuffer> = Buffer.from(
    "authorized_updater_info"
  );
  public METADATA_STATIC_SEED: Buffer<ArrayBuffer> = Buffer.from("metadata");
  public DERIVATIVE_AUTHORITY_STATIC_SEED: Buffer<ArrayBuffer> = Buffer.from(
    "derivative_authority"
  );
  public DERIVATIVE_MINT_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("derivative_mint");

  public fee_percentage: number = 5;
  public fee_percentage_divider: number = 1000;

  public globalInfoPDA!: anchor.web3.PublicKey;
  public globalInfoBump!: number;

  public programId: anchor.web3.PublicKey = new anchor.web3.PublicKey(
    "VE8xoqmnsw8kKEKaHMcdMYXmWqpaSaEKmRmZrjN63TH"
  );

  public founder!: anchor.web3.PublicKey;
  public developer!: anchor.web3.PublicKey;

  private constructor() {
    [this.globalInfoPDA, this.globalInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.GLOBAL_INFO_STATIC_SEED],
        this.programId
      );
  }

  public static getInstance(): Setup {
    if (Setup.instance === null) {
      Setup.instance = new Setup();
    }
    return Setup.instance;
  }

  public getTokenMetadataPDA(mint: anchor.web3.PublicKey): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [derivativeMetadataPDA, derivativeMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          this.METADATA_STATIC_SEED,
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          mint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );
    return {
      pda: derivativeMetadataPDA,
      bump: derivativeMetadataBump,
    };
  }

  public getTokenInfoPDA(
    programId: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [tokenInfoPDA, tokenInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.TOKEN_INFO_STATIC_SEED, mint.toBuffer()],
        programId
      );
    return {
      pda: tokenInfoPDA,
      bump: tokenInfoBump,
    };
  }

  public async getTokenATA(
    mint: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey
  ) {
    return await splToken.getAssociatedTokenAddressSync(mint, owner);
  }

  public getDerivativeATA(
    derivativeMint: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey
  ): anchor.web3.PublicKey {
    const [derivativeAta] = PublicKey.findProgramAddressSync(
      [
        owner.toBuffer(),
        splToken.TOKEN_PROGRAM_ID.toBuffer(),
        derivativeMint.toBuffer(),
      ],
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return derivativeAta;
  }

  public getTokenVault(
    programId: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ): {
    authority: anchor.web3.PublicKey;
    authorityBump: number;
    ata: anchor.web3.PublicKey;
    ataBump: number;
  } {
    const [vaultAuthorityPDA, vaultAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.VAULT_AUTHORITY_STATIC_SEED, mint.toBuffer()],
        programId
      );

    const [vaultAta, vaultAtaBump] = PublicKey.findProgramAddressSync(
      [
        vaultAuthorityPDA.toBuffer(),
        splToken.TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return {
      authority: vaultAuthorityPDA,
      authorityBump: vaultAuthorityBump,
      ata: vaultAta,
      ataBump: vaultAtaBump,
    };
  }

  public getAuthorizedUpdater(
    programId: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey
  ): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [authorizedUpdaterPDA, authorizedUpdaterBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.AUTHORIZED_UPDATER_INFO_STATIC_SEED, owner.toBuffer()],
        programId
      );

    return {
      pda: authorizedUpdaterPDA,
      bump: authorizedUpdaterBump,
    };
  }

  public getDerivativeAuthority(
    programId: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [derivativeAuthorityPDA, derivativeAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.DERIVATIVE_AUTHORITY_STATIC_SEED, mint.toBuffer()],
        programId
      );

    return {
      pda: derivativeAuthorityPDA,
      bump: derivativeAuthorityBump,
    };
  }

  public getDerivativeMint(
    programId: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [derivativeMintPDA, derivativeMintBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.DERIVATIVE_MINT_STATIC_SEED, mint.toBuffer()],
        programId
      );

    return {
      pda: derivativeMintPDA,
      bump: derivativeMintBump,
    };
  }

  public calculateFee(amount: number): number {
    return (amount * this.fee_percentage) / this.fee_percentage_divider;
  }

  public feeShare(fee: number): number {
    return fee / 2;
  }

  public getDerivativeName(tokenName: string): string {
    return "Liquid " + tokenName;
  }

  public getDerivativeSymbol(tokenSymbol: string): string {
    return "li" + tokenSymbol;
  }
}

export const setup: Setup = Setup.getInstance();

export async function fetchLogsFromSignature(
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
