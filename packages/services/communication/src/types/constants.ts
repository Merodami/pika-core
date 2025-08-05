// Email template IDs from previous architecture
export const EMAIL_TEMPLATES = {
  FIELD_STREET_NOISE_WARNING: 'field-street-noise-warning',
  INDUCTION_REQUEST: 'induction_request_template',
  INDUCTION_STATUS: 'induction_status_template',
  PROFESSIONAL_REQUEST_INFO: 'template_request_info',
} as const

// Default email settings
export const EMAIL_DEFAULTS = {
  FROM_NAME: 'Pika',
  BATCH_SIZE: 10,
  BATCH_DELAY_MS: 1000,
} as const

// Cache TTL settings
export const CACHE_TTL = {
  TEMPLATES: 3600, // 1 hour
  EMAIL_HISTORY: 300, // 5 minutes
  NOTIFICATIONS: 60, // 1 minute
} as const

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const
