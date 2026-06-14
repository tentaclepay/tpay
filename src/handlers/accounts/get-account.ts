import type { Account, Handler, Keystore } from "../../types";
import type { Result } from "../../utils/result";
import {
  getAccount as getAccountFromConfig,
  loadAccountConfig,
} from "../../accounts";
import { fail, ok } from "../../utils/result";

type GetAccountParams = {
  label: string;
};

type GetAccountData = Account<Keystore>;
type GetAccountError = "wallet_not_found";
type GetAccountResult = Promise<Result<GetAccountData, GetAccountError>>;

export const getAccount: Handler<GetAccountParams, GetAccountResult> = async ({
  label,
}) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccountFromConfig(accountConfig, label);
    if (!account) return fail("wallet_not_found");

    return ok(account);
  } catch (err) {
    return fail("unknown_error");
  }
};
