import { secrets } from "bun";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SUI_DECIMALS } from "@mysten/sui/utils";

import {
  USDC_DECIMAL,
  USDC_MAINNET_COIN_TYPE,
  USDC_TESTNET_COIN_TYPE,
} from "@tentaclepay/sui-x402";

import type { Handler, Network } from "../../types";
import type { Result } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import { TPAY_NAME } from "../../constant";
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
type BalanceHandlerError = "wallet_not_exists" | "invalid_keystore";
type BalanceHandlerOutput = Promise<
  Result<BalanceHandlerData, BalanceHandlerError>
>;

export const balanceHandler: Handler<
  BalanceHandlersInput,
  BalanceHandlerOutput
> = async ({ label, network }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_exists");

    const client = getNetworkClient(network);

    const { balance: suiBalance } = await client.getBalance({
      owner: account.address,
    });
    const { balance: usdcBalance } = await client.getBalance({
      owner: account.address,
      coinType:
        network === "mainnet" ? USDC_MAINNET_COIN_TYPE : USDC_TESTNET_COIN_TYPE,
    });

    return ok({
      label,
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
