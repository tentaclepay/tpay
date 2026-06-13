export type Handler<TInput, TOutput> = TInput extends undefined
  ? () => TOutput
  : (args: TInput) => TOutput;

export const networks = ["mainnet", "testnet"] as const;
export type Network = (typeof networks)[number];

export const biometricsKeystores = [
  "apple-keychain",
  "windows-hello",
  "gnome-keyring",
] as const;
export type BiometricsKeystore = (typeof biometricsKeystores)[number];

export const fileKeystores = ["file"] as const;
export type FileKeystore = (typeof fileKeystores)[number];

export const appKeystores = ["1password"] as const;
export type AppKeystore = (typeof appKeystores)[number];

export type Keystore = BiometricsKeystore | FileKeystore | AppKeystore;

export type BiometricsAuthentication = {
  keystore: BiometricsKeystore;
};

// export type FileAuthentication = {
// 	keystore: FileKeystore;
// 	path: string;
// };

export type ApplicationAuthentication = {
  keystore: AppKeystore;
};

export type Authentication<TKeystore extends Keystore> =
  TKeystore extends BiometricsKeystore
    ? BiometricsAuthentication
    : // : TKeystore extends FileKeystore
      // 	? FileAuthentication
      TKeystore extends AppKeystore
      ? ApplicationAuthentication
      : unknown;

export type Account<TKeystore extends Keystore> = {
  label: string;
  address: string;
  auth: Authentication<TKeystore>;
  createdAt: Date;
};
