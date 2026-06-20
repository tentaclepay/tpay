import { x402Client as X402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { wrapFetchWithPayment } from "@x402/fetch";

import { ExactSuiScheme } from "@tentaclepay/sui-x402";

import type { Account, Handler } from "../../types";
import type { Result, UnknownError } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import {
  MAINNET_CAIP2_NETWORKS,
  TESTNET_CAIP2_NETWORKS,
  TOKEN_METADATA,
} from "../../constant";
import { getVerifiedSecretKey } from "../../lib/secret-key";
import { verificationReason } from "../../lib/verification";
import { createEvmSigner, createSuiSigner } from "../../lib/x402";
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
    const getSecretKey = async (account: Account) => {
      try {
        return await getVerifiedSecretKey(
          account,
          paymentContext
            ? verificationReason.pay(
                label,
                paymentContext.amount,
                paymentContext.asset
              )
            : `authorize a payment from your "${label}" wallet`
        );
      } catch (err) {
        lastError = err as PayWithFetchError;
        throw err;
      }
    };

    const suiSigner = createSuiSigner(account, getSecretKey);
    const evmSigner = createEvmSigner(account, getSecretKey);

    const exactSuiScheme = new ExactSuiScheme(suiSigner);
    const exactEvmScheme = new ExactEvmScheme(evmSigner);

    const x402Client = new X402Client();
    MAINNET_CAIP2_NETWORKS.forEach((network) => {
      network.startsWith("sui:")
        ? x402Client.register(network, exactSuiScheme)
        : undefined;

      network.startsWith("eip155:")
        ? x402Client.register(network, exactEvmScheme)
        : undefined;
    });
    TESTNET_CAIP2_NETWORKS.forEach((network) => {
      network.startsWith("sui:")
        ? x402Client.register(network, exactSuiScheme)
        : undefined;

      network.startsWith("eip155:")
        ? x402Client.register(network, exactEvmScheme)
        : undefined;
    });

    x402Client.onBeforePaymentCreation(async ({ selectedRequirements }) => {
      const networkTokens =
        TOKEN_METADATA[
          selectedRequirements.network as keyof typeof TOKEN_METADATA
        ];
      if (!networkTokens) return;

      const tokenMetadata =
        networkTokens[
          (selectedRequirements.network.startsWith("sui:")
            ? selectedRequirements.asset
            : selectedRequirements.asset.toLowerCase()) as keyof typeof networkTokens
        ];
      if (!tokenMetadata) return;

      paymentContext = {
        amount:
          Number(selectedRequirements.amount) /
          10 ** (tokenMetadata.decimals ?? 0),
        asset: tokenMetadata.symbol,
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
