import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from '../package.json';
import { terser } from 'rollup-plugin-terser';

const banner = {
  banner() {
    return `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`;
  }
}

const umd_out_base = { format: 'umd', name: 'pluralsCldr'/*, exports: 'named'*/ };

export default {
  input: 'index.js',
  output: [
    { ...umd_out_base, file: 'dist/plurals-cldr.js' },
    { ...umd_out_base, file: 'dist/plurals-cldr.min.js', plugins: [ terser() ] }
  ],
  plugins: [ nodeResolve(), commonjs(), banner ]
};
