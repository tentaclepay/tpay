import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import type { AccountConfig } from "../accounts";
import type { Account, Handler, Keystore } from "../types";
import type { Result } from "../utils/result";
import { isAccountConfigExists, saveAccount } from "../accounts";
import { saveKeystore as saveAppleKeychain } from "../lib/keystore/apple-keychain";
import { fail, ok } from "../utils/result";

type SetupHandlersInput = {
  label: string;
  keystore: Keystore;
};

type SetupHandlerData = void;
type SetupHandlerError =
  | "tpay_ready"
  | "unsupported_keystore"
  | "biometrics_verification_failed"
  | "keystore_function_fail";
type SetupHandlerOutput = Promise<Result<SetupHandlerData, SetupHandlerError>>;

export const setupHandler: Handler<
  SetupHandlersInput,
  SetupHandlerOutput
> = async ({ label, keystore }) => {
  try {
    if (await isAccountConfigExists()) return fail("tpay_ready");

    const keypair = Ed25519Keypair.generate();

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

    const accountConfig = {
      version: 1,
      default: label,
      accounts: {},
    } satisfies AccountConfig;

    await saveAccount(accountConfig, account);

    return ok<void>();
  } catch (err) {
    return fail("unknown_error");
  }
};
