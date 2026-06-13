import { userInfo } from "node:os";
import { defineCommand } from "citty";

import { setupHandler } from "../handlers/setup";
import { biometricsKeystores } from "../types";
import { getOsDefaultKeystore } from "../utils/keystore";

export const setupCommand = defineCommand({
  meta: { name: "setup", description: "Setup Tentacle Pay Wallet" },
  args: {
    keystore: {
      type: "enum",
      options: [...biometricsKeystores],
    },
  },
  run: async ({ args }) => {
    const { username } = await userInfo();
    const label = username.trim();

    const keystore = args.keystore ?? getOsDefaultKeystore();

    const setupResult = await setupHandler({
      label,
      keystore,
    });

    if (!setupResult.success) {
      switch (setupResult.error) {
        case "tpay_ready":
          return console.log(`Tentacle Pay Wallet has been setup sucessfully!`);
        case "unsupported_keystore":
          return console.error(`Unsupported keystore ${keystore}`);
        case "biometrics_verification_failed":
          return console.error(`Biometrics verification failed`);
        case "keystore_function_fail":
          return console.error(`Failed to store wallet to keystore`);
        default:
          return console.error("Unknown error occured");
      }
    }

    return console.log(`Tentacle Pay Wallet has been setup sucessfully!`);
  },
});
