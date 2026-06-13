import chalk from "chalk";
import { defineCommand } from "citty";

import { newHandler } from "../../handlers/accounts/new";
import { setupHandler } from "../../handlers/setup";
import { keystores } from "../../types";

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
      options: [...keystores],
      default: "platform",
    },
  },
  run: async ({ args }) => {
    const newResult = await newHandler({
      label: args.label,
      keystore: args.keystore,
    });

    if (!newResult.success) {
      switch (newResult.error) {
        case "no_wallet": {
          const setupResult = await setupHandler({
            label: args.label,
            keystore: args.keystore,
          });

          if (!setupResult.success) {
            switch (setupResult.error) {
              case "unsupported_keystore":
                return console.error(`Unsupported keystore ${args.keystore}`);
              case "verification_failed":
                return console.error("Verification failed");
              case "failed_to_store":
                return console.error(
                  `Failed to store wallet to ${args.keystore} keystore`
                );
              default:
                return console.error("Unknown error occured");
            }
          }

          const { address } = setupResult.data;

          console.log("Wallet sucessfully created!");
          console.log("===============");
          console.log(chalk.bold("Label:"), args.label);
          console.log(chalk.bold("Address:"), address);

          return;
        }
        case "wallet_already_exists":
          return console.error(
            `Wallet with label "${args.label}" already exists`
          );
        case "unsupported_keystore":
          return console.error(`Unsupported keystore ${args.keystore}`);
        case "verification_failed":
          return console.error("Verification failed");
        case "failed_to_store":
          return console.error(
            `Failed to store wallet to ${args.keystore} keystore`
          );
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
