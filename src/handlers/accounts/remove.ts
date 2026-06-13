import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import {
  getAccount,
  isAccountConfigExists,
  loadAccountConfig,
  removeAccount,
} from "../../accounts";
import { deleteKeystore } from "../../lib/keystore";
import { promptVerification } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

type RemoveHandlersInput = {
  label: string;
};

type RemoveHandlerData = void;
type RemoveHandlerError =
  | "no_wallet"
  | "wallet_not_exists"
  | "unsupported_keystore"
  | "verification_failed";
type RemoveHandlerOutput = Promise<
  Result<RemoveHandlerData, RemoveHandlerError>
>;

export const removeHandler: Handler<
  RemoveHandlersInput,
  RemoveHandlerOutput
> = async ({ label }) => {
  try {
    if (!(await isAccountConfigExists())) return fail("no_wallet");

    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_exists");

    switch (account.keystore) {
      case "platform": {
        const verified = await promptVerification(
          account.keystore,
          `remove wallet "${label}"`
        );
        if (!verified) return fail("verification_failed");

        await deleteKeystore(label);
        break;
      }
      default:
        return fail("unsupported_keystore");
    }

    await removeAccount(accountConfig, label);

    return ok<void>();
  } catch (err) {
    return fail("unknown_error");
  }
};
