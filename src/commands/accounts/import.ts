import chalk from "chalk";
import { defineCommand } from "citty";

import { importHandler } from "../../handlers/accounts/import";
import { biometricsKeystores } from "../../types";
import { getOsDefaultKeystore } from "../../utils/keystore";

export const importCommand = defineCommand({
  meta: { name: "import", description: "Import account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: true,
    },
    secretKey: {
      type: "positional",
      description: "Account secret key",
      required: true,
    },
    keystore: {
      type: "enum",
      options: [...biometricsKeystores],
    },
  },
  run: async ({ args }) => {
    const keystore = args.keystore ?? getOsDefaultKeystore();

    const importResult = await importHandler({
      label: args.label,
      secretKey: args.secretKey,
      keystore,
    });

    if (!importResult.success) {
      switch (importResult.error) {
        case "wallet_already_exists":
          return console.error(
            `Wallet with label "${args.label}" already exists`
          );
        case "invalid_secret_key":
          return console.error(`Invalid secret key`);
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

    const { address } = importResult.data;

    console.log("Wallet sucessfully imported!");
    console.log("===============");
    console.log(chalk.bold("Label:"), args.label);
    console.log(chalk.bold("Address:"), address);
  },
});
