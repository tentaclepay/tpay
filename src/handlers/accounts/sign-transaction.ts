import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import { getKeystore } from "../../lib/keystore/platform";
import { promptVerification } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

type SignTransactionParams = {
  label: string;
  transaction: string;
};

type SignTransactionData = {
  signature: string;
};
type SignTransactionError = "wallet_not_found" | "verification_failed";
type SignTransactionOutput = Promise<
  Result<SignTransactionData, SignTransactionError>
>;

export const signTransaction: Handler<
  SignTransactionParams,
  SignTransactionOutput
> = async ({ label, transaction }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_found");

    switch (account.keystore) {
      case "platform": {
        const verified = await promptVerification(
          account.keystore,
          `export wallet "${label}"`
        );
        if (!verified) return fail("verification_failed");

        const secretKey = await getKeystore(account.label);
        if (!secretKey) return fail("wallet_not_found");

        const keypair = Ed25519Keypair.fromSecretKey(secretKey);

        const { signature } = await keypair.signTransaction(
          fromBase64(transaction)
        );

        return ok({
          signature,
        });
      }
      default:
        return fail("wallet_not_found");
    }
  } catch (err) {
    return fail("unknown_error");
  }
};
