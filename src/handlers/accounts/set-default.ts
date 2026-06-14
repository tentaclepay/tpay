import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import {
  isAccountExist,
  loadAccountConfig,
  setDefaultAccount,
} from "../../accounts";
import { fail, ok } from "../../utils/result";

type SetDefaultParams = {
  label: string;
};

type SetDefaultData = void;
type SetDefaultError = "wallet_not_found";
type SetDefaultResult = Promise<Result<SetDefaultData, SetDefaultError>>;

export const setDefault: Handler<SetDefaultParams, SetDefaultResult> = async ({
  label,
}) => {
  try {
    const accountConfig = await loadAccountConfig();

    if (!isAccountExist(accountConfig, label)) return fail("wallet_not_found");

    await setDefaultAccount(accountConfig, label);

    return ok<void>();
  } catch (err) {
    return fail("unknown_error");
  }
};
