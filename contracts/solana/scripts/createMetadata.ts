import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Collection,
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
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

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const secretKeySeed = [
  139, 158, 254, 32, 156, 51, 198, 209, 246, 164, 57, 247, 144, 224, 179, 6,
  249, 55, 148, 163, 244, 99, 64, 50, 232, 152, 180, 160, 23, 61, 166, 27, 138,
  224, 176, 158, 82, 80, 125, 219, 111, 72, 162, 193, 126, 225, 247, 225, 213,
  115, 124, 234, 47, 71, 197, 196, 245, 179, 113, 135, 108, 86, 240, 35,
];
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKeySeed));
const mintPubkey = new PublicKey(
  "Cz2Pf1MiHXAVNEXATjdNhzk9Fq4mfMN9a1xW7tJB6hz9"
);
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const [metadataPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    mintPubkey.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);

(async function main() {
  try {
    const umi = createUmi(connection);
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(wallet));
    umi.use(signerIdentity(umiSigner, true));

    const onChainData = {
      name: "My Token",
      symbol: "MT",
      uri: "https://domain.com/example.json",
      sellerFeeBasisPoints: 0,
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    };
    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: fromWeb3JsPublicKey(mintPubkey),
      mintAuthority: umiSigner,
    };
    const data: CreateMetadataAccountV3InstructionDataArgs = {
      isMutable: true,
      collectionDetails: null,
      data: onChainData,
    };
    await createMetadataAccountV3(umi, {
      ...accounts,
      ...data,
    }).sendAndConfirm(umi);
    process.exit(0);
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
