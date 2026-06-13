import chalk from "chalk";
import { defineCommand } from "citty";

import { exportHandler } from "../../handlers/accounts/export";

export const exportCommand = defineCommand({
  meta: { name: "export", description: "Export account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: true,
    },
  },
  run: async ({ args }) => {
    const exportResult = await exportHandler({ label: args.label });

    if (!exportResult.success) {
      switch (exportResult.error) {
        case "wallet_not_exists":
          return console.error(
            `Wallet with label "${args.label}" does not exist`
          );
        case "unsupported_keystore":
          return console.error(`Unsupported keystore`);
        case "biometrics_verification_failed":
          return console.error(`Biometrics verification failed`);
        case "keystore_function_fail":
          return console.error(`Failed to read wallet from keystore`);
        default:
          return console.error("Unknown error occured");
      }
    }

    const { address, secretKey } = exportResult.data;

    console.log("Wallet secret key exported!");
    console.log("===============");
    console.log(chalk.bold("Label:"), args.label);
    console.log(chalk.bold("Address:"), address);
    console.log(chalk.bold("Secret Key:"), secretKey);
  },
});
