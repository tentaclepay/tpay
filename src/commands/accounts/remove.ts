import { defineCommand } from "citty";

import { removeAccount } from "../../handlers/accounts/remove-account";
import * as ui from "../../lib/ui";

export const removeCommand = defineCommand({
  meta: { name: "remove", description: "Delete a wallet", alias: "rm" },
  args: {
    label: {
      type: "positional",
      description: "Wallet to remove",
      required: true,
    },
  },
  run: async ({ args }) => {
    const removeAccountResult = await removeAccount({ label: args.label });

    if (!removeAccountResult.success) {
      switch (removeAccountResult.error) {
        case "wallet_not_found":
          return ui.error(
            `Wallet "${args.label}" was not found.`,
            "Run `tpay account list` to see your wallets."
          );
        case "verification_failed":
          return ui.error(
            "Identity verification failed.",
            "Couldn't remove the wallet — authentication was cancelled."
          );
        default:
          return ui.error("Couldn't remove the wallet.", "Please try again.");
      }
    }

    ui.success(`Removed wallet "${args.label}".`);
  },
});
