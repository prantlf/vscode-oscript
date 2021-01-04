import yaml from '@rollup/plugin-yaml'
import copy from 'rollup-plugin-copy'
import config from '../rollup.shared'

export default config('server', [
  yaml(),
  copy({
    targets: [
      { src: ['../../dist/server.*', '../../dist/api.json'], dest: 'dist' }
    ]
  })
])
