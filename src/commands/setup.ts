import { userInfo } from "node:os";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import chalk from "chalk";
import { defineCommand } from "citty";

import { saveAccount } from "../handlers/accounts/save-account";
import { keystores } from "../types";

export const setupCommand = defineCommand({
  meta: { name: "setup", description: "Setup Tentacle Pay Wallet" },
  args: {
    label: {
      type: "string",
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

    const keypair = Ed25519Keypair.generate();

    const saveAccountResult = await saveAccount({
      label,
      keystore: args.keystore,
      secretKey: keypair.getSecretKey(),
      setAsDefault: true,
      override: true,
    });

    if (!saveAccountResult.success) {
      switch (saveAccountResult.error) {
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

    const { address } = saveAccountResult.data;

    console.log(chalk.bold("Done! 🎉\n"));
    console.log("Wallet sucessfully created!");
    console.log("===============");
    console.log(chalk.bold("Label:"), label);
    console.log(chalk.bold("Address:"), address);
  },
});
