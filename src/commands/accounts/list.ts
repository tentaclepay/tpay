import chalk from "chalk";
import { defineCommand } from "citty";

import { listAccounts, loadAccountConfig } from "../../accounts";

export const listCommand = defineCommand({
  meta: { name: "list", description: "Account list", alias: "ls" },
  run: async () => {
    const accountConfig = await loadAccountConfig();

    const accounts = listAccounts(accountConfig);

    console.log("Total:", chalk.bold(accounts.length));
    accounts.forEach((account) => {
      console.log("===============");
      console.log(
        chalk.bold("Label:"),
        account.label,
        account.label === accountConfig.default
          ? chalk.magenta.italic("(active)")
          : ""
      );
      console.log(chalk.bold("Address:"), account.address);
    });
  },
});
