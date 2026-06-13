import chalk from "chalk";
import { defineCommand } from "citty";

import { balanceHandler } from "../../handlers/accounts/balance";
import { getState } from "../../state";

export const currentCommand = defineCommand({
  meta: { name: "current", description: "Get current active account" },
  run: async () => {
    const network = getState("network");

    const label = getState("account");
    if (!label) return console.error(`No wallet found. Run "tpay setup"`);

    const balanceResult = await balanceHandler({
      label,
      network,
    });

    if (!balanceResult.success) {
      switch (balanceResult.error) {
        case "no_wallet":
        case "wallet_not_exists":
          return console.error(`No wallet found. Run "tpay setup"`);
        default:
          return console.error(`Unknown error occured`);
      }
    }

    const balance = balanceResult.data;

    console.log(chalk.bold("Label:"), balance.label);
    console.log(chalk.bold("Address:"), balance.address);
    console.log("===============");
    console.log(
      "~",
      Number(balance.balances.sui) > 0 ? chalk.bold(balance.balances.sui) : "0",
      "SUI"
    );
    console.log(
      "~",
      Number(balance.balances.usdc) > 0
        ? chalk.bold(balance.balances.usdc)
        : "0",
      "USDC"
    );
  },
});
