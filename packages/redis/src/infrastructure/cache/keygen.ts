import { createHash } from 'crypto'
import stringify from 'fast-json-stable-stringify'

/**
 * Default key generator for Cache decorator:
 *  PREFIX:Class.method:HASH(args)
 */
export function defaultKeyGenerator(
  prefix: string,
  methodName: string,
  args: unknown[],
): string {
  // produce a deterministic JSON string of your args
  const payload = stringify(args)
  // hash it to keep the key short
  const digest = createHash('sha256').update(payload).digest('hex')

  return `${prefix}:${methodName}:${digest}`
}

/**
 * HTTP-specific key generator: extracts params and query
 * from an Express Request in args[0], then hashes that.
 */
export function httpRequestKeyGenerator(
  prefix: string,
  methodName: string,
  args: unknown[],
): string {
  // Expect args[0] to be an Express request with params and query
  const req = args[0] as {
    params?: Record<string, unknown>
    query?: Record<string, unknown>
  }

  // Clone into a plain JS object to strip any Express prototype or metadata
  const params = req.params ? Object.assign({}, req.params) : {}
  const query = req.query ? Object.assign({}, req.query) : {}

  // Build a minimal payload for the key
  // For list endpoints, we'll use query params
  // For detail endpoints, we'll use the id from params

  // Build a minimal payload for the key
  // ToDo: We need to adapt this. The cacheKey maybe could be stored on the metadata of the event.
  // Then we could use the cacheKey directly and skip the stringify process.
  // Now is going to use hashed id of the request params
  // const safe = { params, query }

  // Stable stringify and hash
  const payload = stringify({
    ...params,
    ...query,
  })

  const digest = createHash('sha256').update(payload).digest('hex')

  return `${prefix}:${methodName}:${digest}`
}
