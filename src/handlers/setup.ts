import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import type { AccountConfig } from "../accounts";
import type { Account, Handler, Keystore } from "../types";
import type { Result } from "../utils/result";
import { isAccountConfigExists, saveAccount } from "../accounts";
import { saveKeystore } from "../lib/keystore";
import { promptVerification } from "../lib/verification";
import { fail, ok } from "../utils/result";

type SetupHandlersInput = {
  label: string;
  keystore: Keystore;
};

type SetupHandlerData = {
  address: string;
};
type SetupHandlerError =
  | "tpay_ready"
  | "unsupported_keystore"
  | "verification_failed"
  | "failed_to_store";
type SetupHandlerOutput = Promise<Result<SetupHandlerData, SetupHandlerError>>;

export const setupHandler: Handler<
  SetupHandlersInput,
  SetupHandlerOutput
> = async ({ label, keystore }) => {
  try {
    if (await isAccountConfigExists()) return fail("tpay_ready");

    const keypair = Ed25519Keypair.generate();

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
      isDefault: true,
      createdAt: new Date(),
    } satisfies Account<typeof keystore>;

    const accountConfig = {
      version: 1,
      default: label,
      accounts: {},
    } satisfies AccountConfig;

    await saveAccount(accountConfig, account);

    return ok({
      address: account.address,
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
