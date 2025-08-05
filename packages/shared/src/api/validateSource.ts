import { RequestIdSource } from './requestContextStore.js'

export type RequestSource =
  (typeof RequestIdSource)[keyof typeof RequestIdSource]

export function validateSource(source: any): asserts source is RequestSource {
  if (!Object.values(RequestIdSource).includes(source)) {
    throw new Error(`"${source}" is not a valid source.`)
  }
}
