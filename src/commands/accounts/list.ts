import chalk from "chalk";
import { defineCommand } from "citty";

import { listAccounts } from "../../handlers/accounts/list-accounts";
import * as ui from "../../lib/ui";

export const listCommand = defineCommand({
  meta: { name: "list", description: "List all wallets", alias: "ls" },
  run: async () => {
    const listResult = await listAccounts();

    if (!listResult.success) {
      return ui.error(
        "Couldn't read your wallets.",
        "Your config may be missing — run `tpay setup` to create a wallet."
      );
    }

    const accounts = listResult.data;

    if (accounts.length === 0) {
      ui.info("No wallets yet.");
      ui.newline();
      console.log(
        chalk.dim(
          "  Create one with `tpay setup` or `tpay account new <label>`."
        )
      );
      return;
    }

    console.log(
      chalk.bold(`${accounts.length} wallet${accounts.length === 1 ? "" : "s"}`)
    );

    accounts.forEach((account) => {
      ui.newline();
      ui.details([
        [
          "Label",
          account.isDefault
            ? `${account.label} ${ui.brand("(active)")}`
            : account.label,
        ],
        ["Address", account.address],
      ]);
    });
  },
});
