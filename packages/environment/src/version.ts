import packageJson from '../../../package.json' with { type: 'json' }
import { getEnvVariable } from './getEnvVariable.js'

export const APP_VERSION = getEnvVariable('APP_VERSION', String, '0.0.0')
export const VERSION = APP_VERSION || packageJson.version
