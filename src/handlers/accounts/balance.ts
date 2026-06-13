import { SUI_DECIMALS } from "@mysten/sui/utils";

import {
  USDC_DECIMAL,
  USDC_MAINNET_COIN_TYPE,
  USDC_TESTNET_COIN_TYPE,
} from "@tentaclepay/sui-x402";

import type { Handler, Network } from "../../types";
import type { Result } from "../../utils/result";
import {
  getAccount,
  isAccountConfigExists,
  loadAccountConfig,
} from "../../accounts";
import { getNetworkClient } from "../../lib/network";
import { fail, ok } from "../../utils/result";

type BalanceHandlersInput = {
  label: string;
  network: Network;
};

type BalanceHandlerData = {
  label: string;
  address: string;
  balances: {
    sui: string;
    usdc: string;
  };
};
type BalanceHandlerError = "no_wallet" | "wallet_not_exists";
type BalanceHandlerOutput = Promise<
  Result<BalanceHandlerData, BalanceHandlerError>
>;

export const balanceHandler: Handler<
  BalanceHandlersInput,
  BalanceHandlerOutput
> = async ({ label, network }) => {
  try {
    if (!(await isAccountConfigExists())) return fail("no_wallet");

    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_exists");

    const client = getNetworkClient(network);

    const [suiBalance, usdcBalance] = await Promise.all([
      client.getBalance({
        owner: account.address,
      }),
      client.getBalance({
        owner: account.address,
        coinType:
          network === "mainnet"
            ? USDC_MAINNET_COIN_TYPE
            : USDC_TESTNET_COIN_TYPE,
      }),
    ]);

    return ok({
      label: account.label,
      address: account.address,
      balances: {
        sui: (Number(suiBalance.balance) / 10 ** SUI_DECIMALS).toLocaleString(),
        usdc: (
          Number(usdcBalance.balance) /
          10 ** USDC_DECIMAL
        ).toLocaleString(),
      },
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
