import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { defineCommand } from "citty";

import { saveAccount } from "../../handlers/accounts/save-account";
import * as ui from "../../lib/ui";
import { keystores } from "../../types";

export const newCommand = defineCommand({
  meta: { name: "new", description: "Create a new wallet" },
  args: {
    label: {
      type: "positional",
      description: "Name for the new wallet",
      required: true,
    },
    keystore: {
      type: "enum",
      options: [...keystores],
      default: "platform",
      description:
        "Where to store the secret key (platform = your OS keychain)",
    },
    override: {
      type: "boolean",
      description: "Replace an existing wallet with the same name",
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
          return ui.error(
            `Wallet "${args.label}" already exists.`,
            "Pass --override to replace it, or choose another name."
          );
        case "unsupported_keystore":
          return ui.error(
            `Keystore "${args.keystore}" isn't supported.`,
            "Supported keystore: platform."
          );
        case "verification_failed":
          return ui.error(
            "Identity verification failed.",
            "Authentication was cancelled or timed out — try again."
          );
        case "failed_to_store":
          return ui.error(
            `Couldn't save the wallet to the ${args.keystore} keystore.`,
            "Make sure tpay can access your OS keychain, then retry."
          );
        default:
          return ui.error(
            "Something went wrong while creating the wallet.",
            "Please try again."
          );
      }
    }

    const { address } = saveAccountResult.data;

    ui.success(`Created wallet "${args.label}".`);
    ui.newline();
    ui.details([
      ["Label", args.label],
      ["Address", address],
    ]);
  },
});
