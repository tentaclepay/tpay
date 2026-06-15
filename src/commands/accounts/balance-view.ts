import chalk from "chalk";

import type { CoinType, Network } from "../../types";
import {
  MAINNET_COIN_TYPES_DECIMALS,
  TESTNET_COIN_TYPES_DECIMALS,
} from "../../constant";
import { getBalances } from "../../handlers/accounts/get-balances";
import * as ui from "../../lib/ui";

/**
 * Fetch and print a wallet's balances. Shared by `tpay account` and
 * `tpay account balance` so both render identically.
 */
export const showBalances = async ({
  label,
  network,
}: {
  label: string;
  network: Network;
}): Promise<void> => {
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
        return ui.error(
          `Wallet "${label}" was not found.`,
          "Run `tpay account list` to see your wallets."
        );
      default:
        return ui.error(
          "Couldn't fetch balances.",
          "Check your internet connection and try again."
        );
    }
  }

  const { account, balances } = getBalanceResult.data;

  ui.details([
    ["Label", account.label],
    ["Address", account.address],
  ]);
  ui.newline();

  for (const { coinType, balance } of balances) {
    const units = BigInt(balance);
    const decimals = coinTypes[coinType as keyof typeof coinTypes];
    const amount = Number(units) / 10 ** decimals;
    const symbol = coinType.split("::").at(-1) ?? coinType;

    const display = units > 0n ? chalk.bold(amount) : chalk.dim("0");
    console.log(`  ${display} ${symbol}`);
  }
};
