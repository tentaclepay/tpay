import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import type { Account, Handler, Keystore } from "../../types";
import type { Result } from "../../utils/result";
import { isAccountExist, loadAccountConfig, saveAccount } from "../../accounts";
import { saveKeystore as saveAppleKeychain } from "../../lib/keystore/apple-keychain";
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
  | "wallet_already_exists"
  | "invalid_secret_key"
  | "unsupported_keystore"
  | "biometrics_verification_failed"
  | "keystore_function_fail";
type ImportHandlerOutput = Promise<
  Result<ImportHandlerData, ImportHandlerError>
>;

export const importHandler: Handler<
  ImportHandlersInput,
  ImportHandlerOutput
> = async ({ label, secretKey, keystore }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const existingAccount = isAccountExist(accountConfig, label);
    if (existingAccount) return fail("wallet_already_exists");

    let keypair: Ed25519Keypair;
    try {
      keypair = Ed25519Keypair.fromSecretKey(secretKey);
    } catch {
      return fail("invalid_secret_key");
    }

    switch (keystore) {
      case "apple-keychain": {
        const saveResult = await saveAppleKeychain(
          label,
          keypair.getSecretKey(),
          true
        );
        if (!saveResult.success) {
          switch (saveResult.error) {
            case "biometrics_fail":
              return fail("biometrics_verification_failed");
            case "failed_to_store":
              return fail("keystore_function_fail");
            default:
              return fail("unknown_error");
          }
        }

        break;
      }
      default:
        return fail("unsupported_keystore");
    }

    const account = {
      label,
      address: keypair.toSuiAddress(),
      auth: {
        keystore,
      },
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
