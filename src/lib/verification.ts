import { platform } from "node:os";

import type { Keystore } from "../types";

type MacAuth = typeof import("node-mac-auth/build/Release/auth.node");

/**
 * `node-mac-auth` is a macOS-only native addon (Touch ID). The require is gated
 * on `process.env.TPAY_TARGET_OS`, which is inlined at build time via
 * `--define` (see scripts/build.ts). On non-darwin builds the value is "linux",
 * so Bun evaluates the branch to `false` and drops the require entirely — the
 * addon is never installed nor loadable there. For `bun run` in dev the env var
 * is unset and we fall back to the host platform.
 */
let macAuth: MacAuth | null = null;
let macAuthLoaded = false;

const loadMacAuth = (): MacAuth | null => {
  if (macAuthLoaded) return macAuth;
  macAuthLoaded = true;

  if ((process.env.TPAY_TARGET_OS ?? platform()) === "darwin") {
    try {
      macAuth = require("node-mac-auth/build/Release/auth.node") as MacAuth;
    } catch {
      macAuth = null;
    }
  }

  return macAuth;
};

/**
 * Reasons shown in the OS verification prompt (Touch ID on macOS). The system
 * renders them as `"tpay" is trying to <reason>.`, so each phrase must complete
 * that sentence and make clear what the user is authorizing.
 */
export const verificationReason = {
  save: (label: string) => `save the wallet "${label}" to your keychain`,
  export: (label: string) => `reveal the secret key for "${label}"`,
  remove: (label: string) => `remove the wallet "${label}" from your keychain`,
  pay: (label: string, amount: number, symbol: string) =>
    `authorize a payment of ${amount} ${symbol} from your "${label}" wallet`,
};

export const promptVerification = async (
  keystore: Keystore,
  message: string
): Promise<boolean> => {
  switch (keystore) {
    case "platform": {
      const auth = loadMacAuth();

      if (auth?.canPromptTouchID())
        return auth
          .promptTouchID({ reason: message })
          .then(() => true)
          .catch(() => false);

      return true;
    }
    default:
      return true;
  }
};
