import { platform as getPlatform } from "node:os";

import type { Keystore } from "../types";

export const getOsDefaultKeystore = (): Keystore => {
  const platform = getPlatform();

  switch (platform) {
    case "darwin":
      return "apple-keychain";
    case "win32":
      return "windows-hello";
    case "linux":
      return "gnome-keyring";
    default:
      return "file";
  }
};
