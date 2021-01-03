import { nodeResolve } from '@rollup/plugin-node-resolve'
import yaml from '@rollup/plugin-yaml'
import copy from 'rollup-plugin-copy'
import config from '../rollup.shared'

export default config('server', [
  nodeResolve(),
  yaml(),
  copy({
    targets: [
      { src: ['../../dist/server.*', '../../dist/api.json'], dest: 'dist' }
    ]
  })
])
