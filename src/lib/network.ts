import { SuiGrpcClient } from "@mysten/sui/grpc";

import type { Network } from "../types";

const getGrpcBaseUrl = (network: Network): string => {
  switch (network) {
    case "mainnet":
      return "https://fullnode.mainnet.sui.io:443";
    case "testnet":
      return "https://fullnode.testnet.sui.io:443";
    default:
      throw new Error("Invalid network provided");
  }
};

export const getNetworkClient = (network: Network) => {
  const baseUrl = getGrpcBaseUrl(network);
  const client = new SuiGrpcClient({
    network,
    baseUrl,
  });

  return client;
};
