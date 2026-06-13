import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import type { Account, Handler, Keystore } from "../../types";
import type { Result } from "../../utils/result";
import {
  isAccountConfigExists,
  isAccountExist,
  loadAccountConfig,
  saveAccount,
} from "../../accounts";
import { saveKeystore } from "../../lib/keystore";
import { promptVerification } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

type ImportHandlersInput = {
  label: string;
  secretKey: string;
  keystore: Keystore;
};

type ImportHandlerData = {
  address: string;
};
type ImportHandlerError =
  | "no_wallet"
  | "wallet_already_exists"
  | "unsupported_keystore"
  | "verification_failed"
  | "failed_to_store";
type ImportHandlerOutput = Promise<
  Result<ImportHandlerData, ImportHandlerError>
>;

export const importHandler: Handler<
  ImportHandlersInput,
  ImportHandlerOutput
> = async ({ label, secretKey, keystore }) => {
  try {
    if (!(await isAccountConfigExists())) return fail("no_wallet");

    const accountConfig = await loadAccountConfig();

    const existingAccount = isAccountExist(accountConfig, label);
    if (existingAccount) return fail("wallet_already_exists");

    const keypair = Ed25519Keypair.fromSecretKey(secretKey);

    switch (keystore) {
      case "platform": {
        const verified = await promptVerification(
          keystore,
          `store wallet "${label}"`
        );
        if (!verified) return fail("verification_failed");

        const stored = await saveKeystore(label, keypair.getSecretKey());
        if (!stored) return fail("failed_to_store");
        break;
      }
      default:
        return fail("unsupported_keystore");
    }

    const account = {
      label,
      address: keypair.toSuiAddress(),
      keystore,
      isDefault: false,
      createdAt: new Date(),
    } satisfies Account<typeof keystore>;

    await saveAccount(accountConfig, account);

    return ok({
      address: keypair.toSuiAddress(),
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
