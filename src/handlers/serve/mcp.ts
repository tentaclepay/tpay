import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import type { CoinType, Handler, Network } from "../../types";
import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_NETWORK,
  MAINNET_COIN_TYPES_DECIMALS,
  TESTNET_COIN_TYPES_DECIMALS,
} from "../../constant";
import { error, text } from "../../lib/mcp";
import { getBalances } from "../accounts/get-balances";
import { payWithFetch } from "../pay/fetch";

export type ServeMcpParams = {
  /** The active wallet label every tool acts on for this session. */
  label: string;
};

/**
 * Serve an MCP server over stdio exposing the active wallet to agents. Two
 * tools are registered: `pay` (call an x402-protected API, settling payment
 * automatically) and `get_balance`.
 *
 * stdout is reserved for the JSON-RPC stream, so nothing here may print to it —
 * diagnostics belong on stderr.
 */
export const serveMcp: Handler<ServeMcpParams, Promise<void>> = async ({
  label,
}) => {
  const server = new McpServer({ name: APP_NAME, version: APP_VERSION });

  server.registerTool(
    "pay",
    {
      title: "pay",
      description:
        "Make an HTTP request from the active tpay wallet. If the endpoint " +
        "responds with HTTP 402 Payment Required (x402), tpay settles the " +
        "payment from the wallet and retries automatically. The user is asked " +
        "to approve the payment on their device (Touch ID on macOS) before it " +
        "is signed. Returns the upstream response status, headers, and body, " +
        "plus a receipt when a payment was made.",
      inputSchema: {
        url: z
          .string()
          .url()
          .describe("Absolute URL of the API endpoint to call."),
        method: z
          .string()
          .optional()
          .describe(
            "HTTP method (GET, POST, PUT, PATCH, DELETE, ...). Defaults to " +
              "GET, or POST when a body is provided."
          ),
        headers: z
          .record(z.string())
          .optional()
          .describe(
            "Request headers as a key/value object. Do not set a " +
              "PAYMENT-SIGNATURE / X-PAYMENT header — tpay adds it for you."
          ),
        body: z
          .string()
          .optional()
          .describe(
            "Raw request body, sent as-is (e.g. a JSON string). Set the " +
              "matching Content-Type header yourself. Ignored for GET/HEAD."
          ),
      },
      annotations: {
        title: "Pay for an API request",
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, method, headers, body }) => {
      const result = await payWithFetch({ label, url, method, headers, body });

      if (!result.success) {
        switch (result.error) {
          case "wallet_not_found":
            return error(
              `Wallet "${label}" was not found. Run \`tpay account list\` to ` +
                "see available wallets."
            );
          case "verification_failed":
            return error(
              "Payment was not authorized — identity verification was " +
                "cancelled or timed out."
            );
          case "failed_to_build_transaction":
            return error(
              "Couldn't build the payment. The wallet may not have enough " +
                `balance for this request.${
                  result.message ? ` (${result.message})` : ""
                }`
            );
          case "request_failed":
            return error(
              `The request failed.${result.message ? ` ${result.message}` : ""}`
            );
          default:
            return error("Something went wrong while making the request.");
        }
      }

      const {
        status,
        headers: responseHeaders,
        body: responseBody,
      } = result.data;

      const meta = { status, headers: responseHeaders };

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(meta, null, 2) },
          { type: "text" as const, text: responseBody },
        ],
      };
    }
  );

  server.registerTool(
    "get_balance",
    {
      title: "get_balance",
      description:
        "Fetch the active tpay wallet's balances for known stablecoins and " +
        "SUI on the given Sui network. Defaults to mainnet.",
      inputSchema: {
        network: z
          .enum(["mainnet", "testnet"])
          .optional()
          .describe("Sui network to query. Defaults to mainnet."),
      },
      annotations: {
        title: "Get wallet balance",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ network }) => {
      const activeNetwork: Network = network ?? DEFAULT_NETWORK;
      const coinTypes =
        activeNetwork === "mainnet"
          ? MAINNET_COIN_TYPES_DECIMALS
          : TESTNET_COIN_TYPES_DECIMALS;

      const result = await getBalances({
        label,
        network: activeNetwork,
        coinTypes: Object.keys(coinTypes) as CoinType[],
      });

      if (!result.success) {
        if (result.error === "wallet_not_found")
          return error(
            `Wallet "${label}" was not found. Run \`tpay account list\` to ` +
              "see available wallets."
          );
        return error("Couldn't fetch balances. Check the network and retry.");
      }

      const { account, balances } = result.data;

      const formatted = balances.map(({ coinType, balance }) => {
        const decimals = coinTypes[coinType as keyof typeof coinTypes];
        return {
          symbol: coinType.split("::").at(-1) ?? coinType,
          coinType,
          amount: Number(balance) / 10 ** decimals,
        };
      });

      return text(
        JSON.stringify(
          {
            label: account.label,
            address: account.address,
            balances: formatted,
          },
          null,
          2
        )
      );
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};
