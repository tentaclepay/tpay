import parse from "parse-headers";

export const PAYMENT_SIGNATURE_HEADER_RE =
  /^\s*(?:PAYMENT-SIGNATURE|X-PAYMENT)\s*:/i;

export const parseHeaders = (raw: string) => {
  const headers = parse(raw);
  return headers;
};

export const getHeader =
  (headers: { [x: string]: string | string[] }) => (name: string) => {
    const value = headers[name.toLowerCase()];
    if (Array.isArray(value)) return value.at(-1) ?? null;
    return value ?? null;
  };

export const isPassthroughMetadataRequest = (args: string[]): boolean =>
  args.some(
    (a) =>
      a === "-h" ||
      a === "--help" ||
      a === "--manual" ||
      a === "-V" ||
      a === "--version" ||
      a.startsWith("--help=")
  );
