import { platform } from "node:os";

import type { Keystore } from "../types";
import { keychainAuthenticate, keychainCanPrompt } from "./keystore/macos";

// Touch ID on macOS runs inside the same signed helper that performs Keychain
// I/O (see ./keystore/macos), so a single biometric prompt gates the operation
// and the subsequent read is silent — no separate login-keychain password
// dialog. On non-darwin builds the branch is dropped at build time via the
// `TPAY_TARGET_OS` define; in dev the env var is unset and we use the host.
const isDarwin = (process.env.TPAY_TARGET_OS ?? platform()) === "darwin";

/**
 * Reasons shown in the OS verification prompt (Touch ID on macOS). The system
 * renders them as `"tpay" is trying to <reason>.`, so each phrase must complete
 * that sentence and make clear what the user is authorizing.
 */
export const verificationReason = {
  save: (label: string) => `save the wallet "${label}" to your keychain`,
  export: (label: string) => `reveal the secret key for "${label}"`,
  remove: (label: string) => `remove the wallet "${label}" from your keychain`,
  pay: (label: string, amount?: number, symbol?: string) =>
    amount && symbol
      ? `authorize a payment of ${amount} ${symbol} from your "${label}" wallet`
      : `authorize payment from "${label}" wallet`,
};

export const promptVerification = async (
  keystore: Keystore,
  message: string
): Promise<boolean> => {
  switch (keystore) {
    case "platform": {
      // Non-macOS, or a Mac without biometrics configured: nothing to prompt.
      if (!isDarwin) return true;
      if (!(await keychainCanPrompt().catch(() => false))) return true;

      return keychainAuthenticate(message)
        .then(() => true)
        .catch(() => false);
    }
    default:
      return true;
  }
};
