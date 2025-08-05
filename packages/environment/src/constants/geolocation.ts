import { getEnvVariable } from '../getEnvVariable.js'

// Google Maps API key
export const GOOGLE_MAPS_API_KEY = getEnvVariable(
  'GOOGLE_MAPS_API_KEY',
  String,
  '',
)

// Geocoding provider (google or osm)
export const GEOCODING_PROVIDER = getEnvVariable(
  'GEOCODING_PROVIDER',
  String,
  'osm',
)
