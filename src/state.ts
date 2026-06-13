import type { Network } from "./types";

export type State = {
  network: Network;
  account: string | null;
};

const state: State = {
  network: "mainnet",
  account: null,
};

export const setState = <TKey extends keyof State>(
  key: TKey,
  value: State[TKey]
) => {
  state[key] = value;
};

export const getState = <TKey extends keyof State>(key: TKey): State[TKey] => {
  return state[key];
};
