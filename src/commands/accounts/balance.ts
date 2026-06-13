import chalk from "chalk";
import { defineCommand } from "citty";

import { balanceHandler } from "../../handlers/accounts/balance";
import { getState } from "../../state";

export const balanceCommand = defineCommand({
  meta: { name: "balance", description: "Get balance of account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: false,
    },
  },
  run: async ({ args }) => {
    const network = getState("network");

    const label = args.label ?? getState("account");
    if (!label) return console.error(`No wallet found. Run "tpay setup"`);

    const balanceResult = await balanceHandler({
      label,
      network,
    });

    if (!balanceResult.success) {
      switch (balanceResult.error) {
        case "no_wallet":
          return console.error(`No wallet found. Run "tpay setup"`);
        case "wallet_not_exists":
          return console.error(
            `Wallet with label "${args.label}" was not exists`
          );
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
