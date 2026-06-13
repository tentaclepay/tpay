import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import {
  isAccountExist,
  loadAccountConfig,
  setDefaultAccount,
} from "../../accounts";
import { fail, ok } from "../../utils/result";

type DefaultHandlersInput = {
  label: string;
};

type DefaultHandlerData = void;
type DefaultHandlerError = "wallet_not_exists";
type DefaultHandlerOutput = Promise<
  Result<DefaultHandlerData, DefaultHandlerError>
>;

export const defaultHandler: Handler<
  DefaultHandlersInput,
  DefaultHandlerOutput
> = async ({ label }) => {
  try {
    const accountConfig = await loadAccountConfig();

    if (!isAccountExist(accountConfig, label)) return fail("wallet_not_exists");

    await setDefaultAccount(accountConfig, label);

    return ok<void>();
  } catch (err) {
    return fail("unknown_error");
  }
};
