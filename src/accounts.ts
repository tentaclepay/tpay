import fs from "node:fs/promises";

import type { Account, Keystore } from "./types";
import { createConfigDir, isConfigDirExists } from "./config";
import { ACCOUNT_CONFIG_FILE_PATH } from "./constant";

export type AccountLabel = string;

export type AccountConfig<TKeystore extends Keystore = Keystore> = {
  version: number;
  default: AccountLabel;
  accounts: Record<
    AccountLabel,
    Omit<Account<TKeystore>, "label" | "createdAt" | "isDefault"> & {
      created_at: string;
    }
  >;
};

export const isAccountConfigExists = async () =>
  fs.exists(ACCOUNT_CONFIG_FILE_PATH);

export const createAccountConfig = async () => {
  if (!isConfigDirExists()) await createConfigDir();

  const accountConfig: AccountConfig = {
    version: 1,
    default: "",
    accounts: {},
  };

  await fs.writeFile(
    ACCOUNT_CONFIG_FILE_PATH,
    Bun.YAML.stringify(accountConfig, null, 2)
  );
};

export const validateAccountConfig = (accountConfig: AccountConfig) => {
  const isValidDefaultAccount =
    accountConfig.default !== "" || typeof accountConfig.default === "string";
  const containAccounts = Object.keys(accountConfig.accounts).length > 0;

  return isValidDefaultAccount && containAccounts;
};

export const loadAccountConfig = async () => {
  const accountConfigFile = await fs.readFile(ACCOUNT_CONFIG_FILE_PATH, {
    encoding: "utf8",
  });

  const accountConfig = Bun.YAML.parse(accountConfigFile) as AccountConfig;

  return accountConfig;
};

export const listAccounts = (
  accountConfig: AccountConfig
): Account<Keystore>[] => {
  const accounts = Object.entries(accountConfig.accounts).map<
    Account<Keystore>
  >(([label, account]) => ({
    label,
    address: account.address,
    keystore: account.keystore,
    isDefault: label === accountConfig.default,
    createdAt: new Date(account.created_at),
  }));

  return accounts;
};

export const isAccountExist = (
  accountConfig: AccountConfig,
  label: string
): boolean => {
  const account = accountConfig.accounts[label];

  return !!account;
};

export const getAccount = <TKeystore extends Keystore>(
  accountConfig: AccountConfig,
  label: string
): Account<TKeystore> | null => {
  const account = accountConfig.accounts[label];
  if (!account) return null;

  return {
    label,
    address: account.address,
    keystore: account.keystore,
    isDefault: label === accountConfig.default,
    createdAt: new Date(account.created_at),
  } as Account<TKeystore>;
};

export const setDefaultAccount = async (
  accountConfig: AccountConfig,
  label: string
): Promise<void> => {
  accountConfig.default = label;

  return fs.writeFile(
    ACCOUNT_CONFIG_FILE_PATH,
    Bun.YAML.stringify(accountConfig, null, 2)
  );
};

export const saveAccount = async <TKeystore extends Keystore>(
  accountConfig: AccountConfig,
  account: Account<TKeystore>
): Promise<void> => {
  if (account.isDefault) accountConfig.default = account.label;

  accountConfig.accounts[account.label] = {
    address: account.address,
    keystore: account.keystore,
    created_at: account.createdAt.toISOString(),
  };

  return fs.writeFile(
    ACCOUNT_CONFIG_FILE_PATH,
    Bun.YAML.stringify(accountConfig, null, 2)
  );
};

export const removeAccount = async (
  accountConfig: AccountConfig,
  label: string
): Promise<void> => {
  delete accountConfig.accounts[label];

  return fs.writeFile(
    ACCOUNT_CONFIG_FILE_PATH,
    Bun.YAML.stringify(accountConfig, null, 2)
  );
};
