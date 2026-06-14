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

export const toCaip2Network = (network: Network) => {
  switch (network) {
    case "mainnet":
      return "sui:mainnet";
    case "testnet":
      return "sui:testnet";
    default:
      throw new Error("Invalid network provided");
  }
};

export const fromCaip2Network = (caip2: `${string}:${string}`): Network => {
  switch (caip2) {
    case "sui:mainnet":
      return "mainnet";
    case "sui:testnet":
      return "testnet";
    default:
      throw new Error("Invalid network provided");
  }
};
