import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import type { Account, Handler, Keystore } from "../../types";
import type { Result } from "../../utils/result";
import {
  isAccountExist,
  loadAccountConfig,
  saveAccount as saveAccountToConfig,
} from "../../accounts";
import { saveKeystore } from "../../lib/keystore/platform";
import { promptVerification } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

export type SaveAccountParams = {
  label: string;
  keystore: Keystore;
  secretKey: string;
  setAsDefault?: boolean;
  override?: boolean;
};
export type SaveAccountData = {
  address: string;
  createdAt: Date;
};
export type SaveAccountError =
  | "wallet_already_exists"
  | "unsupported_keystore"
  | "verification_failed"
  | "failed_to_store";
export type SaveAccountResult = Promise<
  Result<SaveAccountData, SaveAccountError>
>;

export const saveAccount: Handler<
  SaveAccountParams,
  SaveAccountResult
> = async ({
  label,
  keystore,
  secretKey,
  setAsDefault = false,
  override = false,
}) => {
  try {
    const accountConfig = await loadAccountConfig();

    if (!override) {
      const existingAccount = isAccountExist(accountConfig, label);
      if (existingAccount) return fail("wallet_already_exists");
    }

    const keypair = Ed25519Keypair.fromSecretKey(secretKey);

    const account = {
      label,
      address: keypair.toSuiAddress(),
      keystore,
      isDefault:
        accountConfig.default === "" ||
        Object.keys(accountConfig.accounts).length === 0 ||
        setAsDefault,
      createdAt: new Date(),
    } satisfies Account<typeof keystore>;

    switch (keystore) {
      case "platform": {
        const verified = await promptVerification(
          keystore,
          `save wallet "${label}"`
        );
        if (!verified) return fail("verification_failed");

        const stored = await saveKeystore(label, keypair.getSecretKey());
        if (!stored) return fail("failed_to_store");
        break;
      }
      default:
        return fail("unsupported_keystore");
    }

    await saveAccountToConfig(accountConfig, account);

    return ok({
      address: account.address,
      createdAt: account.createdAt,
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
