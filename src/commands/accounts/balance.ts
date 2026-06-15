import { defineCommand } from "citty";

import { DEFAULT_NETWORK } from "../../constant";
import { getState } from "../../state";
import { showBalances } from "./balance-view";

export const balanceCommand = defineCommand({
  meta: { name: "balance", description: "Show a wallet's balances" },
  args: {
    label: {
      type: "positional",
      description: "Wallet to inspect (defaults to the active wallet)",
      required: false,
    },
    network: {
      type: "enum",
      options: ["mainnet", "testnet"],
      default: DEFAULT_NETWORK,
      alias: "n",
      description: "Network to query (mainnet or testnet)",
    },
  },
  run: async ({ args }) => {
    const label = args.label ?? getState("account");

    await showBalances({ label, network: args.network });
  },
});
