import { userInfo } from "node:os";
import chalk from "chalk";
import { defineCommand } from "citty";

import { setupHandler } from "../handlers/setup";
import { keystores } from "../types";

export const setupCommand = defineCommand({
  meta: { name: "setup", description: "Setup Tentacle Pay Wallet" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: false,
    },
    keystore: {
      type: "enum",
      options: [...keystores],
      default: "platform",
    },
  },
  run: async ({ args }) => {
    const label = args.label ?? userInfo().username.trim();

    const setupResult = await setupHandler({
      label,
      keystore: args.keystore,
    });

    if (!setupResult.success) {
      switch (setupResult.error) {
        case "tpay_ready":
          return console.error(`Tentacle Pay Wallet has been initialized`);
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

    console.log(chalk.bold("Done! 🎉\n"));
    console.log("Wallet sucessfully created!");
    console.log("===============");
    console.log(chalk.bold("Label:"), label);
    console.log(chalk.bold("Address:"), address);
  },
});
