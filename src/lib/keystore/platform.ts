import { platform } from "node:os";
import { secrets } from "bun";

import { APP_NAME } from "../../constant";
import { keychainDelete, keychainRead, keychainStore } from "./macos";

// On macOS, Keychain I/O is funneled through a separately signed helper so the
// item's ACL binds to the helper's stable code identity rather than the
// constantly-rebuilt `tpay` binary (which would trigger the login-keychain
// password prompt on every release). See ./macos. Other platforms keep using
// Bun.secrets (libsecret on Linux, Credential Manager on Windows).
//
// `TPAY_TARGET_OS` is inlined at build time via `--define` (scripts/build.ts);
// in dev it is unset and we fall back to the host platform.
const isDarwin = (process.env.TPAY_TARGET_OS ?? platform()) === "darwin";

export const saveKeystore = async (
  label: string,
  value: string
): Promise<boolean> => {
  if (isDarwin) {
    return keychainStore(label, value)
      .then(() => true)
      .catch(() => false);
  }

  return secrets
    .set({ service: APP_NAME, name: label, value })
    .then(() => true)
    .catch(() => false);
};

export const getKeystore = async (label: string): Promise<string | null> => {
  if (isDarwin) {
    return keychainRead(label).catch(() => null);
  }

  return secrets.get({ service: APP_NAME, name: label }).catch(() => null);
};

export const deleteKeystore = async (label: string): Promise<boolean> => {
  if (isDarwin) {
    return keychainDelete(label)
      .then(() => true)
      .catch(() => false);
  }

  return secrets
    .delete({ service: APP_NAME, name: label })
    .then(() => true)
    .catch(() => false);
};
