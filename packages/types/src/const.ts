export const PaginationOrder = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const

export const UserProfileType = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  USER: 'USER',
  GUEST: 'GUEST',
} as const

export const RequestSource = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  USER: 'USER',
  GUEST: 'GUEST',
  WEBHOOK: 'WEBHOOK',
} as const

export const DaysOfWeek = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const

export const SupportedLanguage = {
  SPANISH: 'es',
  ENGLISH: 'en',
  GUARANI: 'gn',
} as const
