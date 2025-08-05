export * from './FileStorage.js'
export * from './providers/index.js'

// Re-export storage utilities
import { FileStoragePort } from './FileStorage.js'
import {
  LocalFileStorage,
  LocalFileStorageConfig,
} from './providers/LocalFileStorage.js'
import {
  S3FileStorage,
  S3FileStorageConfig,
} from './providers/S3FileStorage.js'

/**
 * Create appropriate file storage based on environment
 * @param config Configuration options
 * @returns FileStorage implementation
 */
export function createFileStorage(config: {
  type: 'local' | 's3'
  local?: LocalFileStorageConfig
  s3?: S3FileStorageConfig
}): FileStoragePort {
  if (config.type === 's3' && config.s3) {
    return new S3FileStorage(config.s3)
  }

  // Default to local storage
  if (config.local) {
    return new LocalFileStorage(config.local)
  }

  throw new Error('Invalid file storage configuration')
}
