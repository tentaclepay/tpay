import { platform } from "node:os";

import type { Keystore } from "../types";

const { canPromptTouchID, promptTouchID } =
  require("node-mac-auth/build/Release/auth.node") as typeof import("node-mac-auth/build/Release/auth.node");

/**
 * Reasons shown in the OS verification prompt (Touch ID on macOS). The system
 * renders them as `"tpay" is trying to <reason>.`, so each phrase must complete
 * that sentence and make clear what the user is authorizing.
 */
export const verificationReason = {
  save: (label: string) => `save the wallet "${label}" to your keychain`,
  export: (label: string) => `reveal the secret key for "${label}"`,
  remove: (label: string) => `remove the wallet "${label}" from your keychain`,
  pay: (label: string) => `authorize a payment from your "${label}" wallet`,
};

export const promptVerification = async (
  keystore: Keystore,
  message: string
): Promise<boolean> => {
  switch (keystore) {
    case "platform": {
      const os = platform();

      if (os === "darwin" && canPromptTouchID())
        return promptTouchID({ reason: message })
          .then(() => true)
          .catch(() => false);

      return true;
    }
    default:
      return true;
  }
};
