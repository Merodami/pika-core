import { LOG_LEVEL, NODE_ENV } from '@pika/environment'

/**
 * Simple logger for Redis package
 * Temporary solution to avoid dependency on @pika
 */

const isTest = NODE_ENV === 'test'
const logLevel = LOG_LEVEL || 'info'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const currentLevel = levels[logLevel as keyof typeof levels] ?? levels.info

class SimpleLogger {
  private prefix = '[Redis]'

  error(message: string, ...args: any[]) {
    if (!isTest && currentLevel >= levels.error) {
      console.error(`${this.prefix} ERROR:`, message, ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    if (!isTest && currentLevel >= levels.warn) {
      console.warn(`${this.prefix} WARN:`, message, ...args)
    }
  }

  info(message: string, ...args: any[]) {
    if (!isTest && currentLevel >= levels.info) {
      console.info(`${this.prefix} INFO:`, message, ...args)
    }
  }

  debug(message: string, ...args: any[]) {
    if (!isTest && currentLevel >= levels.debug) {
      console.debug(`${this.prefix} DEBUG:`, message, ...args)
    }
  }
}

export const logger = new SimpleLogger()
