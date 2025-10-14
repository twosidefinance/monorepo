import { assert } from "chai";
import {
  airdropToWallets,
  program,
  developer,
  founder,
  user,
  globalInfoPDA,
} from "./setup";

describe("Program Initialization", () => {
  before(async () => {
    await airdropToWallets();
  });

  it("Normal Initialization", async () => {
    const tx = await program.methods
      .initializeProgram(developer.publicKey, founder.publicKey)
      .accounts({
        signer: user.publicKey,
      })
      .signers([user])
      .rpc();

    const globalInfoAccount =
      await program.account.globalInfo.fetch(globalInfoPDA);

    const developerWalletStr = globalInfoAccount.developerWallet.toBase58();
    const founderWalletStr = globalInfoAccount.founderWallet.toBase58();
    const feePercentageNum = globalInfoAccount.feePercentage.toNumber();
    const feeDividerNum = globalInfoAccount.feePercentageDivider.toNumber();
    const developerFeeShareNum = globalInfoAccount.developerFeeShare.toNumber();
    const founderFeeShareNum = globalInfoAccount.founderFeeShare.toNumber();
    const minLockValueNum = globalInfoAccount.minLockValue;

    assert(
      founder.publicKey.toString() == founderWalletStr,
      "Wrong Founder Address Set"
    );
    assert(
      developer.publicKey.toString() == developerWalletStr,
      "Wrong Developer Address Set"
    );
    assert(feePercentageNum == 5, "Wrong feePercentage Set");
    assert(feeDividerNum == 1000, "Wrong feePercentageDivider Set");
    assert(developerFeeShareNum == 50, "Wrong developerFeeShare Set");
    assert(founderFeeShareNum == 50, "Wrong founderFeeShare Set");
    assert(minLockValueNum == 400, "Wrong minLockValue Set");
  });
});
