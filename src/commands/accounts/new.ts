import chalk from "chalk";
import { defineCommand } from "citty";

import { newHandler } from "../../handlers/accounts/new";
import { biometricsKeystores } from "../../types";
import { getOsDefaultKeystore } from "../../utils/keystore";

export const newCommand = defineCommand({
  meta: { name: "new", description: "Create new account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: true,
    },
    keystore: {
      type: "enum",
      options: [...biometricsKeystores],
    },
  },
  run: async ({ args }) => {
    const keystore = args.keystore ?? getOsDefaultKeystore();

    const newResult = await newHandler({ label: args.label, keystore });

    if (!newResult.success) {
      switch (newResult.error) {
        case "wallet_already_exists":
          return console.error(
            `Wallet with label "${args.label}" already exists`
          );
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

    const { address } = newResult.data;

    console.log("Wallet sucessfully created!");
    console.log("===============");
    console.log(chalk.bold("Label:"), args.label);
    console.log(chalk.bold("Address:"), address);
  },
});
