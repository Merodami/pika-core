/**
 * Geolocation types
 */

export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface DistanceCalculation {
  from: Coordinates
  to: Coordinates
  distance: number
  unit: 'km' | 'miles'
}
