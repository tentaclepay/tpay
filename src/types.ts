export type Handler<TInput, TOutput> = TInput extends undefined
  ? () => TOutput
  : (args: TInput) => TOutput;

export const networks = ["mainnet", "testnet"] as const;
export type Network = (typeof networks)[number];

export const platformKeystores = ["platform"] as const;
export type PlatformKeystore = (typeof platformKeystores)[number];

export const fileKeystores = ["file"] as const;
export type FileKeystore = (typeof fileKeystores)[number];

export const appKeystores = ["1password"] as const;
export type AppKeystore = (typeof appKeystores)[number];

export const keystores = [
  ...platformKeystores,
  ...fileKeystores,
  ...appKeystores,
] as const;
export type Keystore = (typeof keystores)[number];

export type Account<TKeystore extends Keystore = Keystore> = {
  label: string;
  address: string;
  keystore: TKeystore;
  isDefault: boolean;
  createdAt: Date;
};

export type CoinType = `0x${string}::${string}::${string}`;

export type Balance = {
  coinType: CoinType;
  balance: string;
};
