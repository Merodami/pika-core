/**
 * A simple, cross-environment compatible logger for the SDK
 */

/**
 * Interface for a logger implementation
 */
export interface LoggerInstance {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

/**
 * Default no-op logger that does nothing
 */
const noopLogger: LoggerInstance = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

/**
 * Console logger implementation
 */
const consoleLogger: LoggerInstance = {
  debug: (message: string, ...args: any[]) =>
    console.debug(`[SDK] ${message}`, ...args),
  info: (message: string, ...args: any[]) =>
    console.info(`[SDK] ${message}`, ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(`[SDK] ${message}`, ...args),
  error: (message: string, ...args: any[]) =>
    console.error(`[SDK] ${message}`, ...args),
}

/**
 * Determines if we're in a browser environment
 */
export const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

/**
 * Safe function to check if we're in development mode,
 * works in both Node.js and browser environments
 */
export function isDevelopment(): boolean {
  try {
    // Browser environment check using process.env for Next.js compatibility
    if (isBrowser && typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development'
    }

    // Node.js environment
    if (!isBrowser && typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development'
    }

    return false
  } catch {
    // Ignore all errors and return false
    return false
  }
}

/**
 * Create a logger instance based on environment
 */
function createLoggerInstance(): LoggerInstance {
  try {
    // In production, we might want to disable logging or use a more
    // sophisticated logging solution
    if (!isDevelopment()) {
      // In production browser, only show errors and warnings
      if (isBrowser) {
        return {
          debug: () => {},
          info: () => {},
          warn: consoleLogger.warn,
          error: consoleLogger.error,
        }
      }

      // In production server, use no-op logger
      // (In a real app, you might want to use a proper logging service here)
      return noopLogger
    }

    // In development, use console logger
    return consoleLogger
  } catch {
    // Fallback to console in case of errors
    return consoleLogger
  }
}

/**
 * The default logger instance
 */
export const logger = createLoggerInstance()

/**
 * Creates a logger function compatible with the RetryConfig interface
 */
export const createRetryLogger = (customLogger: LoggerInstance = logger) => {
  return (message: string, error?: unknown): void => {
    customLogger.warn(message)

    // Only log detailed errors in development
    if (isDevelopment() && error) {
      customLogger.warn('Error details:', error)
    }
  }
}

export default logger
