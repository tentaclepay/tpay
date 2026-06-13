import { secrets } from "bun";

import type { Result } from "../../utils/result";
import { TPAY_NAME } from "../../constant";
import { fail, ok } from "../../utils/result";

// node-mac-auth's entry point loads the addon via the `bindings` package, which
// walks the filesystem for a package.json — a path that doesn't exist inside a
// `bun build --compile` binary (/$bunfs). Requiring the .node file directly
// lets Bun embed the addon in the executable.
const { canPromptTouchID, promptTouchID } =
  require("node-mac-auth/build/Release/auth.node") as typeof import("node-mac-auth/build/Release/auth.node");

export type SaveKeystoreError = "biometrics_fail" | "failed_to_store";
export const saveKeystore = async (
  label: string,
  value: string,
  biometrics: boolean = true
): Promise<Result<void, SaveKeystoreError>> => {
  if (biometrics && canPromptTouchID()) {
    const biometricResult = await promptTouchID({
      reason: `save wallet labelled "${label}"`,
    })
      .then(() => true)
      .catch(() => false);
    if (!biometricResult) return fail("biometrics_fail");
  }

  const storeResult = await secrets
    .set({
      service: TPAY_NAME,
      name: label,
      value,
    })
    .then(() => true)
    .catch(() => false);
  if (!storeResult) return fail("failed_to_store");

  return ok();
};

export type GetKeystoreError = "biometrics_fail" | "not_found";
export const getKeystore = async (
  label: string,
  biometrics: boolean = true
): Promise<Result<string, GetKeystoreError>> => {
  if (biometrics && canPromptTouchID()) {
    const biometricResult = await promptTouchID({
      reason: `export wallet labelled "${label}"`,
    })
      .then(() => true)
      .catch(() => false);
    if (!biometricResult) return fail("biometrics_fail");
  }

  const secretKey = await secrets
    .get({
      service: TPAY_NAME,
      name: label,
    })
    .catch(() => null);
  if (!secretKey) return fail("not_found");

  return ok(secretKey);
};

export type DeleteKeystoreError = "biometrics_fail" | "failed_to_delete";
export const deleteKeystore = async (
  label: string,
  biometrics: boolean = true
): Promise<Result<void, DeleteKeystoreError>> => {
  if (biometrics && canPromptTouchID()) {
    const biometricResult = await promptTouchID({
      reason: `remove wallet labelled "${label}"`,
    })
      .then(() => true)
      .catch(() => false);
    if (!biometricResult) return fail("biometrics_fail");
  }

  const deleteResult = await secrets
    .delete({
      service: TPAY_NAME,
      name: label,
    })
    .catch(() => false);
  if (!deleteResult) return fail("failed_to_delete");

  return ok();
};
