import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import { getKeystore } from "../../lib/keystore/platform";
import { promptVerification } from "../../lib/verification";
import { fail, ok } from "../../utils/result";

type ExportAccountParams = {
  label: string;
};

type ExportAccountData = {
  address: string;
  secretKey: string;
};
type ExportAccountError = "wallet_not_found" | "verification_failed";
type ExportAccountOutput = Promise<
  Result<ExportAccountData, ExportAccountError>
>;

export const exportAccount: Handler<
  ExportAccountParams,
  ExportAccountOutput
> = async ({ label }) => {
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

        return ok({
          label: account.label,
          address: account.address,
          secretKey,
        });
      }
      default:
        return fail("wallet_not_found");
    }
  } catch (err) {
    return fail("unknown_error");
  }
};
