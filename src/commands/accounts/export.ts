import chalk from "chalk";
import { defineCommand } from "citty";

import { exportAccount } from "../../handlers/accounts/export-account";

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
    const exportAccountResult = await exportAccount({ label: args.label });

    if (!exportAccountResult.success) {
      switch (exportAccountResult.error) {
        case "wallet_not_found":
          return console.error(
            `Wallet with label "${args.label}" was not found`
          );
        case "verification_failed":
          return console.error(
            "Verification failed! Unable to export wallet from the keystore"
          );
        default:
          return console.error("Unknown error occured");
      }
    }

    const { address, secretKey } = exportAccountResult.data;

    console.log("Wallet secret key exported!");
    console.log("===============");
    console.log(chalk.bold("Label:"), args.label);
    console.log(chalk.bold("Address:"), address);
    console.log(chalk.bold("Secret Key:"), secretKey);
  },
});
