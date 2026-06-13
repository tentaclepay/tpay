import type { Account, Handler, Keystore } from "../../types";
import type { Result } from "../../utils/result";
import {
  isAccountConfigExists,
  listAccounts,
  loadAccountConfig,
} from "../../accounts";
import { fail, ok } from "../../utils/result";

type ListHandlersInput = undefined;
type ListHandlerData = Account<Keystore>[];
type ListHandlerOutput = Promise<Result<ListHandlerData>>;

export const listHandler: Handler<
  ListHandlersInput,
  ListHandlerOutput
> = async () => {
  try {
    if (!(await isAccountConfigExists())) return ok([]);

    const accountConfig = await loadAccountConfig();

    const accounts = listAccounts(accountConfig);

    return ok(accounts);
  } catch (err) {
    return fail("unknown_error");
  }
};
