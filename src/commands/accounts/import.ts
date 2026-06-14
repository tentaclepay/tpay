import chalk from "chalk";
import { defineCommand } from "citty";

import { saveAccount } from "../../handlers/accounts/save-account";
import { keystores } from "../../types";

export const importCommand = defineCommand({
  meta: { name: "import", description: "Import account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: true,
    },
    "secret-key": {
      type: "string",
      description: "Account secret key",
      required: true,
    },
    keystore: {
      type: "enum",
      options: [...keystores],
      default: "platform",
    },
    override: {
      type: "boolean",
      description: "Override existing wallet",
      default: false,
    },
  },
  run: async ({ args }) => {
    const importResult = await saveAccount({
      label: args.label,
      secretKey: args["secret-key"],
      keystore: args.keystore,
      override: args.override,
    });

    if (!importResult.success) {
      switch (importResult.error) {
        case "wallet_already_exists":
          return console.error(
            `Wallet with label "${args.label}" already exists`
          );
        case "unsupported_keystore":
          return console.error(`Unsupported keystore ${args.keystore}`);
        case "verification_failed":
          return console.error(
            "Verification failed! Unable to import wallet to the keystore"
          );
        case "failed_to_store":
          return console.error(
            `Failed to import wallet to ${args.keystore} keystore`
          );
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
