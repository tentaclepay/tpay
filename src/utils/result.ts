export type SuccessResultWithoutData = {
  success: true;
};

export type SuccessResultWithData<TData> = {
  success: true;
  data: TData;
};

export type SuccessResult<TData> =
  | SuccessResultWithoutData
  | SuccessResultWithData<TData>;

export type FailedResult<TError extends string | "unknown_error"> = {
  success: false;
  error: TError;
};

export type Result<TData = void, TError extends string = "unknown_error"> =
  | ([TData] extends [void]
      ? SuccessResultWithoutData
      : SuccessResultWithData<TData>)
  | FailedResult<TError | "unknown_error">;

export function ok(): SuccessResultWithoutData;
export function ok<TData extends void>(): SuccessResultWithoutData;
export function ok<TData>(data: TData): SuccessResultWithData<TData>;
export function ok<TData>(data?: TData): SuccessResult<TData> {
  if (!data)
    return {
      success: true,
    };

  return { success: true, data };
}

export function fail<TError extends string>(
  error: TError | "unknown_error"
): FailedResult<TError> {
  return {
    success: false,
    error: error as TError,
  };
}
