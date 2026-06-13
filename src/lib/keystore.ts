import { secrets } from "bun";

import { TPAY_NAME } from "../constant";

export const saveKeystore = async (
  label: string,
  value: string
): Promise<boolean> => {
  const stored = await secrets
    .set({
      service: TPAY_NAME,
      name: label,
      value,
    })
    .then(() => true)
    .catch(() => false);

  return stored;
};

export const getKeystore = async (label: string): Promise<string | null> => {
  const secretKey = await secrets
    .get({
      service: TPAY_NAME,
      name: label,
    })
    .catch(() => null);

  return secretKey;
};

export const deleteKeystore = async (label: string): Promise<boolean> => {
  const deleted = await secrets
    .delete({
      service: TPAY_NAME,
      name: label,
    })
    .catch(() => false);

  return deleted;
};
