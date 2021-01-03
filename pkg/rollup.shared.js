import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import sucrase from '@rollup/plugin-sucrase'
import { terser } from 'rollup-plugin-terser'

const production = process.env.NODE_ENV === "production"

export default function (name, plugins = []) {
  return {
    input: `src/${name}.ts`,
    output: {
      file: `../../dist/${name}.js`,
      format: 'cjs',
      sourcemap: true
    },
    external: ['vscode'],
    plugins: [
      nodeResolve({ extensions: ['.js', '.ts'] }),
      commonjs(),
      ...plugins,
      sucrase({
        exclude: ['node_modules/**'],
        transforms: ['typescript'],
        production
      }),
      production && terser()
    ]
  }
}
