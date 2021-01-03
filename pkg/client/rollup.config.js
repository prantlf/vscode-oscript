import config from '../rollup.shared'
import json from '@rollup/plugin-json'

export default config('extension', [json()])
