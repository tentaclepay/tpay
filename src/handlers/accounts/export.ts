import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import {
  getAccount,
  isAccountConfigExists,
  loadAccountConfig,
} from "../../accounts";
import { getKeystore } from "../../lib/keystore";
import { promptVerification } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

type ExportHandlersInput = {
  label: string;
};

type ExportHandlerData = {
  label: string;
  address: string;
  secretKey: string;
};
type ExportHandlerError =
  | "no_wallet"
  | "wallet_not_exists"
  | "unsupported_keystore"
  | "verification_failed";
type ExportHandlerOutput = Promise<
  Result<ExportHandlerData, ExportHandlerError>
>;

export const exportHandler: Handler<
  ExportHandlersInput,
  ExportHandlerOutput
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
          `get wallet "${label}"`
        );
        if (!verified) return fail("verification_failed");

        const secretKey = await getKeystore(account.label);
        if (!secretKey) return fail("wallet_not_exists");

        return ok({
          label: account.label,
          address: account.address,
          secretKey,
        });
      }
      default:
        return fail("unsupported_keystore");
    }
  } catch (err) {
    return fail("unknown_error");
  }
};
