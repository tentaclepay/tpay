import type { PaymentPayload, PaymentRequired } from "@x402/core/types";
import { x402Client as X402Client, x402HTTPClient } from "@x402/core/client";

import { ExactSuiScheme } from "@tentaclepay/sui-x402";

import type { Handler } from "../../types";
import type { Result, UnknownError } from "../../utils/result";
import { getAccount, loadAccountConfig } from "../../accounts";
import { MAINNET_CAIP2_NETWORKS, TESTNET_CAIP2_NETWORKS } from "../../constant";
import {
  getHeader,
  isPassthroughMetadataRequest,
  PAYMENT_SIGNATURE_HEADER_RE,
  parseHeaders,
} from "../../lib/curl";
import { getKeystore } from "../../lib/keystore/platform";
import { promptVerification, verificationReason } from "../../lib/verification";
import { createSuiSigner } from "../../lib/x402";
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
export type PayWIthCurlResult = Promise<
  Result<PayWithCurlData, PayWithCurlError>
>;

export const payWithCurl: Handler<
  PayWithCurlParams,
  PayWIthCurlResult
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

    const suiSigner = createSuiSigner(account, async (account) => {
      const verified = await promptVerification(
        account.keystore,
        verificationReason.pay(label)
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
      Bun.spawn(["curl", ...args], {
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      });

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

    Bun.spawn(curlWithPayment, {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    return ok();
  } catch (err) {
    if (err === lastError) return fail(lastError, lastErrorMessage);

    return fail("unknown_error");
  }
};
