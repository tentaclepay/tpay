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

export type UnknownError = "unknown_error";

export type FailedResult<TError extends string | UnknownError> = {
  success: false;
  error: TError;
  message?: string;
};

export type Result<TData = void, TError extends string = UnknownError> =
  | ([TData] extends [void]
      ? SuccessResultWithoutData
      : SuccessResultWithData<TData>)
  | FailedResult<TError | UnknownError>;

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
  error: TError | UnknownError,
  message?: string
): FailedResult<TError> {
  return {
    success: false,
    error: error as TError,
    message,
  };
}
