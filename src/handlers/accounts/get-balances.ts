import type {
  Account,
  Balance,
  CoinType,
  Handler,
  Keystore,
  Network,
} from "../../types";
import type { Result } from "../../utils/result";
import {
  getAccount as getAccountFromConfig,
  loadAccountConfig,
} from "../../accounts";
import { getNetworkClient } from "../../lib/network";
import { fail, ok } from "../../utils/result";

type GetBalancesParams = {
  label: string;
  coinTypes: CoinType[];
  network: Network;
};

type GetBalancesData = {
  account: Account<Keystore>;
  balances: Balance[];
};
type GetBalancesError = "wallet_not_found";
type GetBalancesResult = Promise<Result<GetBalancesData, GetBalancesError>>;

export const getBalances: Handler<
  GetBalancesParams,
  GetBalancesResult
> = async ({ label, coinTypes, network }) => {
  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccountFromConfig(accountConfig, label);
    if (!account) return fail("wallet_not_found");

    const client = getNetworkClient(network);

    const getBalancePromises = coinTypes.map((coinType) =>
      client.getBalance({
        owner: account.address,
        coinType,
      })
    );

    const balancesResponse = await Promise.all(getBalancePromises);

    const balances = balancesResponse.map<Balance>(({ balance }) => ({
      coinType: balance.coinType as CoinType,
      balance: balance.balance,
    }));

    return ok({
      account,
      balances,
    });
  } catch (err) {
    return fail("unknown_error");
  }
};
