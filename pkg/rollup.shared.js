import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import sucrase from '@rollup/plugin-sucrase'
import { terser } from 'rollup-plugin-terser'
import builtins from 'builtin-modules'

const production = process.env.NODE_ENV === "production"

export default function (name, plugins = [], external = []) {
  return {
    input: `src/${name}.ts`,
    output: {
      file: `../../dist/${name}.js`,
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ extensions: ['.js', '.ts'] }),
      commonjs(),
      ...plugins,
      sucrase({
        transforms: ['typescript'],
        production
      }),
      production && terser()
    ],
    external: ['vscode', ...builtins, ...external]
  }
}
