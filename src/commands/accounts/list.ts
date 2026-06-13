import chalk from "chalk";
import { defineCommand } from "citty";

import { listHandler } from "../../handlers/accounts/list";

export const listCommand = defineCommand({
  meta: { name: "list", description: "Account list", alias: "ls" },
  run: async () => {
    const listResult = await listHandler();

    if (!listResult.success) {
      switch (listResult.error) {
        default:
          return console.error(`Unknown error occured`);
      }
    }

    const accounts = listResult.data;

    console.log("Total Wallet:", chalk.bold(accounts.length));
    accounts.forEach((account) => {
      console.log("===============");
      console.log(
        chalk.bold("Label:"),
        account.label,
        account.isDefault ? chalk.magenta.italic("(active)") : ""
      );
      console.log(chalk.bold("Address:"), account.address);
    });
  },
});
