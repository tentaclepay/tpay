import { defineCommand } from "citty";

import { setDefault } from "../../handlers/accounts/set-default";
import * as ui from "../../lib/ui";

export const defaultCommand = defineCommand({
  meta: { name: "default", description: "Set the active (default) wallet" },
  args: {
    label: {
      type: "positional",
      description: "Wallet to make active",
      required: true,
    },
  },
  run: async ({ args }) => {
    const setDefaultResult = await setDefault({ label: args.label });

    if (!setDefaultResult.success) {
      switch (setDefaultResult.error) {
        case "wallet_not_found":
          return ui.error(
            `Wallet "${args.label}" was not found.`,
            "Run `tpay account list` to see your wallets."
          );
        default:
          return ui.error(
            "Couldn't set the active wallet.",
            "Please try again."
          );
      }
    }

    ui.success(`"${args.label}" is now your active wallet.`);
  },
});
