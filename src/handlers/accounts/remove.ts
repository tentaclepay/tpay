import type { BiometricsKeystore, Handler } from "../../types";
import type { Result } from "../../utils/result";
import { getAccount, loadAccountConfig, removeAccount } from "../../accounts";
import { deleteKeystore as deleteAppleKeychain } from "../../lib/keystore/apple-keychain";
import { fail, ok } from "../../utils/result";

type RemoveHandlersInput = {
  label: string;
};

type RemoveHandlerData = void;
type RemoveHandlerError =
  | "wallet_not_exists"
  | "unsupported_keystore"
  | "biometrics_verification_failed"
  | "keystore_function_fail";
type RemoveHandlerOutput = Promise<
  Result<RemoveHandlerData, RemoveHandlerError>
>;

export const removeHandler: Handler<
  RemoveHandlersInput,
  RemoveHandlerOutput
> = async ({ label }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount<BiometricsKeystore>(accountConfig, label);
    if (!account) return fail("wallet_not_exists");

    switch (account.auth.keystore) {
      case "apple-keychain": {
        const deleteResult = await deleteAppleKeychain(label, true);
        if (!deleteResult.success) {
          switch (deleteResult.error) {
            case "biometrics_fail":
              return fail("biometrics_verification_failed");
            case "failed_to_delete":
              return fail("keystore_function_fail");
            default:
              return fail("unknown_error");
          }
        }

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
