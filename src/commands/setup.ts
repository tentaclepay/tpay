import { userInfo } from "node:os";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { defineCommand } from "citty";

import { saveAccount } from "../handlers/accounts/save-account";
import * as ui from "../lib/ui";
import { keystores } from "../types";

export const setupCommand = defineCommand({
  meta: {
    name: "setup",
    description: "Create your first wallet and initialize tpay",
  },
  args: {
    label: {
      type: "string",
      description: "Name for the wallet (defaults to your system username)",
      required: false,
    },
    keystore: {
      type: "enum",
      options: [...keystores],
      default: "platform",
      description:
        "Where to store the secret key (platform = your OS keychain)",
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
            "Something went wrong while creating your wallet.",
            "Please try again."
          );
      }
    }

    const { address } = saveAccountResult.data;

    ui.success("Wallet created 🎉");
    ui.newline();
    ui.details([
      ["Label", label],
      ["Address", address],
    ]);
    ui.newline();
    ui.info("Fund this address with USDC to start paying for APIs.");
  },
});
