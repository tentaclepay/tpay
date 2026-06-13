import type { BiometricsKeystore, Handler } from "../../types";
import type { Result } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import { getKeystore as getAppleKeychain } from "../../lib/keystore/apple-keychain";
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
  | "wallet_not_exists"
  | "unsupported_keystore"
  | "biometrics_verification_failed"
  | "keystore_function_fail";
type ExportHandlerOutput = Promise<
  Result<ExportHandlerData, ExportHandlerError>
>;

export const exportHandler: Handler<
  ExportHandlersInput,
  ExportHandlerOutput
> = async ({ label }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount<BiometricsKeystore>(accountConfig, label);
    if (!account) return fail("wallet_not_exists");

    let secretKey: string;
    switch (account.auth.keystore) {
      case "apple-keychain": {
        const getResult = await getAppleKeychain(label, true);
        if (!getResult.success) {
          switch (getResult.error) {
            case "biometrics_fail":
              return fail("biometrics_verification_failed");
            case "not_found":
              return fail("keystore_function_fail");
            default:
              return fail("unknown_error");
          }
        }

        secretKey = getResult.data;
        break;
      }
      default:
        return fail("unsupported_keystore");
    }

    return ok({
      label: account.label,
      address: account.address,
      secretKey,
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
