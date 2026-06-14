import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import chalk from "chalk";
import { defineCommand } from "citty";

import { saveAccount } from "../../handlers/accounts/save-account";
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
    override: {
      type: "boolean",
      description: "Override existing wallet",
      default: false,
    },
  },
  run: async ({ args }) => {
    const keypair = Ed25519Keypair.generate();

    const saveAccountResult = await saveAccount({
      label: args.label,
      keystore: args.keystore,
      secretKey: keypair.getSecretKey(),
      override: args.override,
    });

    if (!saveAccountResult.success) {
      switch (saveAccountResult.error) {
        case "wallet_already_exists":
          return console.error(
            `Wallet with label "${args.label}" already exists`
          );
        case "unsupported_keystore":
          return console.error(`Unsupported keystore ${args.keystore}`);
        case "verification_failed":
          return console.error(
            "Verification failed! Unable to save wallet to the keystore"
          );
        case "failed_to_store":
          return console.error(
            `Failed to store wallet to ${args.keystore} keystore`
          );
        default:
          return console.error("Unknown error occured");
      }
    }

    const { address } = saveAccountResult.data;

    console.log("Wallet sucessfully created!");
    console.log("===============");
    console.log(chalk.bold("Label:"), args.label);
    console.log(chalk.bold("Address:"), address);
  },
});
