import {
  PDF_RATE_LIMIT_MAX_REQUESTS_PER_DAY,
  PDF_RATE_LIMIT_MAX_REQUESTS_PER_HOUR,
  PDF_RATE_LIMIT_WINDOW_SIZE_MINUTES,
} from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'

export interface RateLimitConfig {
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  windowSizeMinutes: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number
}

export class PDFGenerationRateLimiter {
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    maxRequestsPerHour: PDF_RATE_LIMIT_MAX_REQUESTS_PER_HOUR,
    maxRequestsPerDay: PDF_RATE_LIMIT_MAX_REQUESTS_PER_DAY,
    windowSizeMinutes: PDF_RATE_LIMIT_WINDOW_SIZE_MINUTES,
  }

  constructor(
    private readonly cacheService: ICacheService,
    private readonly config: RateLimitConfig = PDFGenerationRateLimiter.DEFAULT_CONFIG,
  ) {}

  /**
   * Check if user is within rate limits for PDF generation
   */
  async checkRateLimit(userId: string): Promise<RateLimitResult> {
    try {
      const now = new Date()
      const hourKey = this.getHourlyKey(userId, now)
      const dayKey = this.getDailyKey(userId, now)

      // Check hourly limit
      const hourlyCount = await this.incrementCounter(hourKey, 3600) // 1 hour TTL
      const hourlyRemaining = Math.max(
        0,
        this.config.maxRequestsPerHour - hourlyCount,
      )

      if (hourlyCount > this.config.maxRequestsPerHour) {
        logger.warn('PDF generation rate limit exceeded (hourly)', {
          userId,
          count: hourlyCount,
          limit: this.config.maxRequestsPerHour,
        })

        return {
          allowed: false,
          remaining: 0,
          resetTime: this.getNextHourReset(now),
          retryAfter: this.getSecondsUntilNextHour(now),
        }
      }

      // Check daily limit
      const dailyCount = await this.incrementCounter(dayKey, 86400) // 24 hours TTL
      const dailyRemaining = Math.max(
        0,
        this.config.maxRequestsPerDay - dailyCount,
      )

      if (dailyCount > this.config.maxRequestsPerDay) {
        logger.warn('PDF generation rate limit exceeded (daily)', {
          userId,
          count: dailyCount,
          limit: this.config.maxRequestsPerDay,
        })

        return {
          allowed: false,
          remaining: 0,
          resetTime: this.getNextDayReset(now),
          retryAfter: this.getSecondsUntilNextDay(now),
        }
      }

      return {
        allowed: true,
        remaining: Math.min(hourlyRemaining, dailyRemaining),
        resetTime: this.getNextHourReset(now),
      }
    } catch (error) {
      logger.error('Rate limit check failed', { userId, error })

      // Fail open - allow request if rate limiting service is down
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerHour,
        resetTime: this.getNextHourReset(new Date()),
      }
    }
  }

  /**
   * Get rate limit status without incrementing counters
   */
  async getRateLimitStatus(userId: string): Promise<RateLimitResult> {
    try {
      const now = new Date()
      const hourKey = this.getHourlyKey(userId, now)
      const dayKey = this.getDailyKey(userId, now)

      const hourlyCount = await this.getCounter(hourKey)
      const dailyCount = await this.getCounter(dayKey)

      const hourlyRemaining = Math.max(
        0,
        this.config.maxRequestsPerHour - hourlyCount,
      )
      const dailyRemaining = Math.max(
        0,
        this.config.maxRequestsPerDay - dailyCount,
      )

      const withinLimits =
        hourlyCount <= this.config.maxRequestsPerHour &&
        dailyCount <= this.config.maxRequestsPerDay

      return {
        allowed: withinLimits,
        remaining: Math.min(hourlyRemaining, dailyRemaining),
        resetTime: this.getNextHourReset(now),
        retryAfter: withinLimits
          ? undefined
          : this.getSecondsUntilNextHour(now),
      }
    } catch (error) {
      logger.error('Rate limit status check failed', { userId, error })

      return {
        allowed: true,
        remaining: this.config.maxRequestsPerHour,
        resetTime: this.getNextHourReset(new Date()),
      }
    }
  }

  private async incrementCounter(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    const currentValue = await this.cacheService.get(key)
    const newValue = currentValue ? parseInt(currentValue as string) + 1 : 1

    await this.cacheService.set(key, newValue.toString(), ttlSeconds)

    return newValue
  }

  private async getCounter(key: string): Promise<number> {
    const value = await this.cacheService.get(key)

    return value ? parseInt(value as string) : 0
  }

  private getHourlyKey(userId: string, date: Date): string {
    const hour = date.getUTCHours()
    const day = date.getUTCDate()
    const month = date.getUTCMonth()
    const year = date.getUTCFullYear()

    return `pdf_rate_limit:hourly:${userId}:${year}-${month}-${day}-${hour}`
  }

  private getDailyKey(userId: string, date: Date): string {
    const day = date.getUTCDate()
    const month = date.getUTCMonth()
    const year = date.getUTCFullYear()

    return `pdf_rate_limit:daily:${userId}:${year}-${month}-${day}`
  }

  private getNextHourReset(date: Date): Date {
    const nextHour = new Date(date)

    nextHour.setUTCHours(date.getUTCHours() + 1, 0, 0, 0)

    return nextHour
  }

  private getNextDayReset(date: Date): Date {
    const nextDay = new Date(date)

    nextDay.setUTCDate(date.getUTCDate() + 1)
    nextDay.setUTCHours(0, 0, 0, 0)

    return nextDay
  }

  private getSecondsUntilNextHour(date: Date): number {
    const nextHour = this.getNextHourReset(date)

    return Math.ceil((nextHour.getTime() - date.getTime()) / 1000)
  }

  private getSecondsUntilNextDay(date: Date): number {
    const nextDay = this.getNextDayReset(date)

    return Math.ceil((nextDay.getTime() - date.getTime()) / 1000)
  }
}
