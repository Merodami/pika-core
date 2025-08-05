/**
 * A type representing potential API errors.
 *
 * Extends the standard Error object to include an optional `body` property which may contain
 * additional information such as a message and error data. The `data` object can further provide
 * details like an error code, status code, and message.
 *
 * @typedef {Error & { body?: {
 *   message: string,
 *   data?: {
 *     code?: string,
 *     status_code?: string,
 *     message?: string
 *   }
 * }}} MaybeAPIError
 */
export type MaybeAPIError = Error & {
  body?: {
    message: string
    data?: {
      code?: string
      status_code?: string
      message?: string
    }
  }
}

/**
 * Extracts a human-readable error message from an unknown error object.
 *
 * This function takes an error of unknown type and attempts to cast it as a `MaybeAPIError`.
 * It then returns the error message contained in the error's `body.message` if available,
 * otherwise it returns the standard error message from `error.message`.
 *
 * @param {*} error - The error object to parse.
 * @returns {string|null} The extracted error message or null if no error is provided.
 */
export function getErrorMessage(error: unknown) {
  if (!error) {
    return null
  }

  const castError = error as MaybeAPIError

  return castError.body?.message ?? castError.message
}
