import type { AccountLabel } from "./accounts";

export type State = {
  account: AccountLabel;
};

const state = {} as State;

export const setState = <TKey extends keyof State>(
  key: TKey,
  value: State[TKey]
) => {
  state[key] = value;
};

export const getState = <TKey extends keyof State>(key: TKey): State[TKey] => {
  return state[key];
};
