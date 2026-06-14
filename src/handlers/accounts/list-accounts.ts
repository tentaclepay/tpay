import type { Account, Handler, Keystore } from "../../types";
import type { Result } from "../../utils/result";
import {
  listAccounts as listAccountFromConfig,
  loadAccountConfig,
} from "../../accounts";
import { fail, ok } from "../../utils/result";

type ListAccountsParams = undefined;
type ListAccountsData = Account<Keystore>[];
type ListAccountsResult = Promise<Result<ListAccountsData>>;

export const listAccounts: Handler<
  ListAccountsParams,
  ListAccountsResult
> = async () => {
  try {
    const accountConfig = await loadAccountConfig();

    const accounts = listAccountFromConfig(accountConfig);

    return ok(accounts);
  } catch (err) {
    return fail("unknown_error");
  }
};
