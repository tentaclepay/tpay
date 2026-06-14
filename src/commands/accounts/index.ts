import chalk from "chalk";
import { defineCommand } from "citty";

import type { CoinType } from "../../types";
import {
  MAINNET_COIN_TYPES_DECIMALS,
  TESTNET_COIN_TYPES_DECIMALS,
} from "../../constant";
import { getBalances } from "../../handlers/accounts/get-balances";
import { getState } from "../../state";

export const accountCommand = defineCommand({
  meta: { name: "account", description: "Account" },
  run: async ({ args }) => {
    if (args._.length) return;

    const network = getState("network");

    const label = args.label ?? getState("account");

    const coinTypes =
      network === "mainnet"
        ? MAINNET_COIN_TYPES_DECIMALS
        : TESTNET_COIN_TYPES_DECIMALS;

    const getBalanceResult = await getBalances({
      label,
      network,
      coinTypes: Object.keys(coinTypes) as CoinType[],
    });

    if (!getBalanceResult.success) {
      switch (getBalanceResult.error) {
        case "wallet_not_found":
          return console.error(
            `Wallet with label "${args.label}" was not found`
          );
        default:
          return console.error(`Unknown error occured`);
      }
    }

    const { account, balances } = getBalanceResult.data;

    console.log(chalk.bold("Label:"), account.label);
    console.log(chalk.bold("Address:"), account.address);
    console.log("===============");
    balances.forEach(({ coinType, balance }) => {
      const balanceUnit = BigInt(balance);
      const decimals = coinTypes[coinType as keyof typeof coinTypes];
      const balanceDecimal = Number(balanceUnit) / 10 ** decimals;
      const symbol = coinType.split("::").at(-1);

      console.log(
        "~",
        balanceUnit > 0n ? chalk.bold(balanceDecimal) : "0",
        symbol
      );
    });
  },
  subCommands: {
    balance: () => import("./balance").then((m) => m.balanceCommand),
    default: () => import("./default").then((m) => m.defaultCommand),
    export: () => import("./export").then((m) => m.exportCommand),
    import: () => import("./import").then((m) => m.importCommand),
    list: () => import("./list").then((m) => m.listCommand),
    new: () => import("./new").then((m) => m.newCommand),
    remove: () => import("./remove").then((m) => m.removeCommand),
  },
});
