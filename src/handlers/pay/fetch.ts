import { x402Client as X402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";

import { ExactSuiScheme } from "@tentaclepay/sui-x402";

import type { Handler } from "../../types";
import type { Result, UnknownError } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import {
  MAINNET_CAIP2_NETWORKS,
  MAINNET_COIN_TYPES_DECIMALS,
  TESTNET_CAIP2_NETWORKS,
  TESTNET_COIN_TYPES_DECIMALS,
} from "../../constant";
import { getKeystore } from "../../lib/keystore/platform";
import { promptVerification, verificationReason } from "../../lib/verification";
import { createSuiSigner } from "../../lib/x402";
import { fail, ok } from "../../utils/result";

export type PayWithFetchParams = {
  label: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};
export type PayWithFetchData = {
  status: number;
  headers: Record<string, string>;
  body: string;
};
export type PayWithFetchError =
  | "wallet_not_found"
  | "failed_to_build_transaction"
  | "verification_failed"
  | "request_failed";
export type PayWithFetchResult = Promise<
  Result<PayWithFetchData, PayWithFetchError>
>;

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

/**
 * Perform an HTTP request with `fetch`, settling any x402 payment automatically
 * from the active wallet. This is the programmatic sibling of `payWithCurl`,
 * used by the MCP `pay` tool so agents can call paid APIs. Payment creation is
 * gated behind the same OS verification prompt (Touch ID on macOS).
 */
export const payWithFetch: Handler<
  PayWithFetchParams,
  PayWithFetchResult
> = async ({ label, url, method, headers, body }) => {
  let lastError: PayWithFetchError | UnknownError = "unknown_error";
  let lastErrorMessage: string | undefined;

  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_found");

    let paymentContext: { amount: number; asset: string };
    const suiSigner = createSuiSigner(account, async (account) => {
      const verified = await promptVerification(
        account.keystore,
        paymentContext
          ? verificationReason.pay(
              label,
              paymentContext.amount,
              paymentContext.asset
            )
          : `authorize a payment from your "${label}" wallet`
      );
      if (!verified) {
        lastError = "verification_failed";
        throw lastError;
      }

      const secretKey = await getKeystore(account.label);
      if (!secretKey) {
        lastError = "wallet_not_found";
        throw lastError;
      }

      return secretKey;
    });

    const exactSuiScheme = new ExactSuiScheme(suiSigner);

    const x402Client = new X402Client();
    MAINNET_CAIP2_NETWORKS.map((network) =>
      x402Client.register(network, exactSuiScheme)
    );
    TESTNET_CAIP2_NETWORKS.map((network) =>
      x402Client.register(network, exactSuiScheme)
    );

    x402Client.onBeforePaymentCreation(async ({ selectedRequirements }) => {
      const coinDecimals =
        selectedRequirements.network === "sui:mainnet"
          ? MAINNET_COIN_TYPES_DECIMALS
          : TESTNET_COIN_TYPES_DECIMALS;
      const coinType = selectedRequirements.asset as keyof typeof coinDecimals;

      paymentContext = {
        amount:
          Number(selectedRequirements.amount) /
          10 ** (coinDecimals[coinType] ?? 0),
        asset: coinType.split("::").at(-1) ?? coinType,
      };
    });

    x402Client.onPaymentCreationFailure(({ error }) => {
      lastError = "failed_to_build_transaction";
      lastErrorMessage = error.message;
      throw lastError;
    });

    const fetchWithPayment = wrapFetchWithPayment(fetch, x402Client);

    const requestMethod = (
      method ?? (body !== undefined ? "POST" : "GET")
    ).toUpperCase();

    const init: RequestInit = { method: requestMethod, headers };
    if (body !== undefined && !BODYLESS_METHODS.has(requestMethod))
      init.body = body;

    const response = await fetchWithPayment(url, init);

    const responseBody = await response.text();

    return ok({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: responseBody,
    });
  } catch (err) {
    if (err === lastError) return fail(lastError, lastErrorMessage);

    return fail("unknown_error");
  }
};
