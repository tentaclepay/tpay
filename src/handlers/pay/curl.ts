import type { PaymentPayload, PaymentRequired } from "@x402/core/types";
import { x402Client as X402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";

import { ExactSuiScheme } from "@tentaclepay/sui-x402";

import type { Account, Handler } from "../../types";
import type { Result, UnknownError } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import {
  MAINNET_CAIP2_NETWORKS,
  TESTNET_CAIP2_NETWORKS,
  TOKEN_METADATA,
} from "../../constant";
import {
  getHeader,
  isPassthroughMetadataRequest,
  PAYMENT_SIGNATURE_HEADER_RE,
  parseHeaders,
} from "../../lib/curl";
import { getVerifiedSecretKey } from "../../lib/secret-key";
import { verificationReason } from "../../lib/verification";
import { createEvmSigner, createSuiSigner } from "../../lib/x402";
import { fail, ok } from "../../utils/result";

export type PayWithCurlParams = {
  label: string;
  args: string[];
};
export type PayWithCurlData = void;
export type PayWithCurlError =
  | "wallet_not_found"
  | "x402_payment_attempted"
  | "failed_to_build_transaction"
  | "verification_failed";
export type PayWithCurlResult = Promise<
  Result<PayWithCurlData, PayWithCurlError>
>;

export const payWithCurl: Handler<
  PayWithCurlParams,
  PayWithCurlResult
> = async ({ label, args }) => {
  if (isPassthroughMetadataRequest(args)) {
    Bun.spawn(["curl", ...args], {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    return ok();
  }

  let lastError: PayWithCurlError | UnknownError = "unknown_error";
  let lastErrorMessage: string | undefined;

  try {
    const accountConfig = await loadAccountConfig();

    const account = getAccount(accountConfig, label);
    if (!account) return fail("wallet_not_found");

    if (args.some((arg) => PAYMENT_SIGNATURE_HEADER_RE.test(arg)))
      return fail("x402_payment_attempted");

    let paymentContext: { amount: number; asset: string };
    const getSecretKey = async (account: Account) => {
      try {
        return await getVerifiedSecretKey(
          account,
          verificationReason.pay(
            label,
            paymentContext?.amount,
            paymentContext?.asset
          )
        );
      } catch (err) {
        lastError = err as PayWithCurlError;
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

    const x402HttpClient = new x402HTTPClient(x402Client);

    const curl = ["curl", ...args, "-i"];
    const paymentRequiredRequest = Bun.spawn(curl, {
      stdin: "inherit",
      stdout: "pipe",
      stderr: "pipe",
    });
    const paymentRequiredRequestData = await new Response(
      paymentRequiredRequest.stdout
    ).text();

    const headers = parseHeaders(paymentRequiredRequestData);

    let paymentRequired: PaymentRequired;
    try {
      paymentRequired = x402HttpClient.getPaymentRequiredResponse(
        getHeader(headers)
      );
    } catch {
      const proc = Bun.spawn(["curl", ...args], {
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      });
      await proc.exited;

      return ok();
    }

    let paymentPayload: PaymentPayload;
    try {
      paymentPayload =
        await x402HttpClient.createPaymentPayload(paymentRequired);
    } catch (err) {
      if (err instanceof Error) {
        lastError = "failed_to_build_transaction";
        lastErrorMessage = err.message;
        throw lastError;
      }

      throw err;
    }

    let paymentHeaders: Record<string, string>;
    try {
      paymentHeaders =
        x402HttpClient.encodePaymentSignatureHeader(paymentPayload);
    } catch (err) {
      if (err instanceof Error) {
        lastError = "failed_to_build_transaction";
        lastErrorMessage = err.message;
        throw lastError;
      }

      throw err;
    }

    const headerArgs = Object.entries(paymentHeaders).flatMap(
      ([key, value]) => ["-H", `${key}: ${value}`]
    );

    const curlWithPayment = ["curl", ...args, ...headerArgs];

    const proc = Bun.spawn(curlWithPayment, {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    await proc.exited;

    return ok();
  } catch (err) {
    if (err === lastError) return fail(lastError, lastErrorMessage);

    return fail("unknown_error");
  }
};
