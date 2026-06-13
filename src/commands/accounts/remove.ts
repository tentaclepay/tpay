import { defineCommand } from "citty";

import { removeHandler } from "../../handlers/accounts/remove";

export const removeCommand = defineCommand({
  meta: { name: "remove", description: "Remove account", alias: "rm" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: true,
    },
  },
  run: async ({ args }) => {
    const removeResult = await removeHandler({ label: args.label });

    if (!removeResult.success) {
      switch (removeResult.error) {
        case "wallet_not_exists":
          return console.error(
            `Wallet with label "${args.label}" does not exist`
          );
        case "unsupported_keystore":
          return console.error(`Unsupported keystore`);
        case "biometrics_verification_failed":
          return console.error(`Biometrics verification failed`);
        case "keystore_function_fail":
          return console.error(`Failed to remove wallet from keystore`);
        default:
          return console.error("Unknown error occured");
      }
    }

    console.log(`Account with label "${args.label}" was removed!`);
  },
});
