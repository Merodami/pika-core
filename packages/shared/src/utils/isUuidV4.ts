import { validate as uuidValidate, version as uuidVersion } from 'uuid'

export function isUuidV4(id: string): boolean {
  return uuidValidate(id) && uuidVersion(id) === 4
}
