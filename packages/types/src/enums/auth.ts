/**
 * Authentication and authorization related enums
 */

export enum TokenType {
  ACCESS_TOKEN = 'accessToken',
  REFRESH_TOKEN = 'refreshToken',
}

export enum GrantType {
  PASSWORD = 'password',
  REFRESH_TOKEN = 'refreshToken',
  CLIENT_CREDENTIALS = 'clientCredentials',
}

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export enum OAuthError {
  INVALID_REQUEST = 'invalidRequest',
  INVALID_CLIENT = 'invalidClient',
  INVALID_GRANT = 'invalidGrant',
  UNAUTHORIZED_CLIENT = 'unauthorizedClient',
  UNSUPPORTED_GRANT_TYPE = 'unsupportedGrantType',
  INVALID_SCOPE = 'invalidScope',
  SERVER_ERROR = 'serverError',
  TEMPORARILY_UNAVAILABLE = 'temporarilyUnavailable',
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  OTHER = 'other',
}
