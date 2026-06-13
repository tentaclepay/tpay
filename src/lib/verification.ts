import { platform } from "node:os";

import type { Keystore } from "../types";

const { canPromptTouchID, promptTouchID } =
  require("node-mac-auth/build/Release/auth.node") as typeof import("node-mac-auth/build/Release/auth.node");

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
