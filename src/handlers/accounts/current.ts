import { userInfo } from "node:os";

import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import { getAccount, listAccounts, loadAccountConfig } from "../../accounts";
import { fail, ok } from "../../utils/result";

type CurrentHandlersInput = undefined;

type CurrentHandlerData = {
  label: string;
  address: string;
};
type CurrentHandlerError = "wallet_not_exists";
type CurrentHandlerOutput = Promise<
  Result<CurrentHandlerData, CurrentHandlerError>
>;

export const currentHandler: Handler<
  CurrentHandlersInput,
  CurrentHandlerOutput
> = async () => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount(
      accountConfig,
      accountConfig.default ??
        listAccounts(accountConfig).at(0)?.label ??
        userInfo().username
    );
    if (!account) return fail("wallet_not_exists");

    return ok({
      label: account.label,
      address: account.address,
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
