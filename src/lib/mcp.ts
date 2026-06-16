/** Build a `tool` result carrying a single block of text. */
export const text = (value: string) => ({
  content: [{ type: "text" as const, text: value }],
});

/** Build an error `tool` result the host surfaces back to the model. */
export const error = (message: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: message }],
});
