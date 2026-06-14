import { defineCommand } from "citty";

import { removeAccount } from "../../handlers/accounts/remove-account";

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
    const removeAccountResult = await removeAccount({ label: args.label });

    if (!removeAccountResult.success) {
      switch (removeAccountResult.error) {
        case "wallet_not_found":
          return console.error(
            `Wallet with label "${args.label}" was not found`
          );
        case "verification_failed":
          return console.error(
            "Verification failed! Unable to remove wallet from the keystore"
          );
        default:
          return console.error("Unknown error occured");
      }
    }

    console.log(`Account with label "${args.label}" was removed!`);
  },
});
