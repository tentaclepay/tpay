import { defineCommand } from "citty";

import { saveAccount } from "../../handlers/accounts/save-account";
import * as ui from "../../lib/ui";
import { keystores } from "../../types";

export const importCommand = defineCommand({
  meta: { name: "import", description: "Import a wallet from a secret key" },
  args: {
    label: {
      type: "positional",
      description: "Name for the imported wallet",
      required: true,
    },
    "secret-key": {
      type: "string",
      description: "Secret key to import (e.g. suiprivkey…)",
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
    const importResult = await saveAccount({
      label: args.label,
      secretKey: args["secret-key"],
      keystore: args.keystore,
      override: args.override,
    });

    if (!importResult.success) {
      switch (importResult.error) {
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
            "Couldn't import the wallet — authentication was cancelled."
          );
        case "failed_to_store":
          return ui.error(
            `Couldn't save the wallet to the ${args.keystore} keystore.`,
            "Make sure tpay can access your OS keychain, then retry."
          );
        default:
          return ui.error(
            "Something went wrong while importing the wallet.",
            "Double-check the secret key, then try again."
          );
      }
    }

    const { address } = importResult.data;

    ui.success(`Imported wallet "${args.label}".`);
    ui.newline();
    ui.details([
      ["Label", args.label],
      ["Address", address],
    ]);
  },
});
