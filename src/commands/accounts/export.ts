import { defineCommand } from "citty";

import { exportAccount } from "../../handlers/accounts/export-account";
import * as ui from "../../lib/ui";

export const exportCommand = defineCommand({
  meta: { name: "export", description: "Reveal a wallet's secret key" },
  args: {
    label: {
      type: "positional",
      description: "Wallet to export",
      required: true,
    },
  },
  run: async ({ args }) => {
    const exportAccountResult = await exportAccount({ label: args.label });

    if (!exportAccountResult.success) {
      switch (exportAccountResult.error) {
        case "wallet_not_found":
          return ui.error(
            `Wallet "${args.label}" was not found.`,
            "Run `tpay account list` to see your wallets."
          );
        case "verification_failed":
          return ui.error(
            "Identity verification failed.",
            "Couldn't reveal the secret key — authentication was cancelled."
          );
        default:
          return ui.error("Couldn't export the wallet.", "Please try again.");
      }
    }

    const { address, secretKey } = exportAccountResult.data;

    ui.warn("Your secret key controls this wallet. Never share it.");
    ui.newline();
    ui.details([
      ["Label", args.label],
      ["Address", address],
      ["Secret Key", secretKey],
    ]);
  },
});
