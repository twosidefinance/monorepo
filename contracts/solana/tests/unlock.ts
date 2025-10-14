import { assert } from "chai";
import {
  getOrCreateDerivativeMint,
  getOrCreateDeveloperAta,
  getOrCreateFounderAta,
  getOrCreateTokenMint,
  getOrCreateUserDerivativeAta,
  getOrCreateUserTokenAta,
  program,
  tokenDecimals,
  user,
} from "./setup";
import * as anchor from "@coral-xyz/anchor";

describe("Token Unlocking", () => {
  it("Normal Unlock", async () => {
    const tokenMint = await getOrCreateTokenMint();
    const derivativeMint = await getOrCreateDerivativeMint();
    const userTokenAta = await getOrCreateUserTokenAta();
    let founderAta = await getOrCreateFounderAta();
    let developerAta = await getOrCreateDeveloperAta();
    const userDerivativeAta = await getOrCreateUserDerivativeAta();

    console.log("Token Mint: ", tokenMint.toString());
    console.log("Derivative Mint: ", derivativeMint.toString());
    console.log("");
    console.log("");
    console.log("Signer: ", user.publicKey.toString());
    console.log("Signer Token ATA: ", userTokenAta.address.toString());
    console.log("Signer Derivative ATA: ", userDerivativeAta.toString());

    const unlockAmount = 5 * 10 ** tokenDecimals;
    await program.methods
      .unlock(new anchor.BN(unlockAmount))
      .accounts({
        tokenMint: tokenMint,
        signer: user.publicKey,
        signerTokenAta: userTokenAta.address,
        founderAta: founderAta.address,
        developerAta: developerAta.address,
      })
      .signers([user])
      .rpc();
  });
});
