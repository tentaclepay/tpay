import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import {
  getAccount,
  loadAccountConfig,
  removeAccount as removeAccountOnConfig,
} from "../../accounts";
import { deleteKeystore } from "../../lib/keystore/platform";
import { promptVerification, verificationReason } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

export type RemoveAccountParams = {
  label: string;
};
export type RemoveAccountData = void;
export type RemoveAccountError = "wallet_not_found" | "verification_failed";
export type RemoveAccountResult = Promise<
  Result<RemoveAccountData, RemoveAccountError>
>;

export const removeAccount: Handler<
  RemoveAccountParams,
  RemoveAccountResult
> = async ({ label }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_found");

    switch (account.keystore) {
      case "platform": {
        const verified = await promptVerification(
          account.keystore,
          verificationReason.remove(label)
        );
        if (!verified) return fail("verification_failed");

        await deleteKeystore(label);
        break;
      }
      default:
      // Pass-through and remove immediately on config file
    }

    await removeAccountOnConfig(accountConfig, label);

    return ok<void>();
  } catch (err) {
    return fail("unknown_error");
  }
};
