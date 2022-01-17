// @ts-check
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import livereload from 'rollup-plugin-livereload';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import html from 'rollup-plugin-bundle-html-plus';
import typescript from '@rollup/plugin-typescript';
import svgr from '@svgr/rollup';
import dotenv from "rollup-plugin-dotenv";
import del from 'rollup-plugin-delete';

const production = !process.env.ROLLUP_WATCH;

/** @typedef {import("rollup").RollupOptions} RollupOptions */

/**
* Transpiling React code and injecting into index.html for Figma
* @type {RollupOptions}
*/
const uiOptions = {
  input: 'src/app/index.tsx',
  output: {
    sourcemap: !production,
    name: 'ui',
    dir: 'dist/app',
    format: 'es',
  },
  preserveEntrySignatures: false,
  plugins: [
    // What extensions is rollup looking for
    resolve({
      extensions: ['.jsx', '.js', '.json', '.ts', '.tsx'],
      browser: true,
      preferBuiltins: false,
      dedupe: ['react', 'react-dom'],
    }),

    dotenv(),

    // Manage process.env
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(production),
    }),

    typescript({
      tsconfig: 'tsconfig.app.json',
      sourceMap: !production,
      inlineSourceMap: !production,
      outputToFilesystem: false,
    }),

    // Babel config to support React
    babel({
      presets: ['@babel/preset-react', '@babel/preset-env'],
      babelHelpers: 'runtime',
      plugins: ['@babel/plugin-transform-runtime'],
      extensions: ['.js', '.ts', 'tsx', 'jsx'],
      compact: true,
      exclude: 'node_modules/**',
    }),

    commonjs(),

    svgr(),

    // Config to allow sass and css modules
    postcss({
      extract: false,
      modules: true,
      use: ['sass'],
      sourceMap: !production,
    }),

    // Injecting UI code into ui.html
    html({
      template: 'src/app/index.html',
      dest: 'dist/app',
      filename: 'index.html',
      inline: !production,
      inject: 'body',
      ignore: /code.js/,
      scriptType: 'module',
      sourcemap: !production,
      sourceMap: !production,
    }),

    // If dev mode, serve and livereload
    !production && serve(),
    !production && livereload({
      watch: ['dist', '.env.local' /* KO */],
      delay: 100,
    }),

    // If prod mode, minify
    production && terser(),

    del({
      targets: 'dist/app/*',
      runOnce: true
    }),
  ],
  watch: {
    // clearScreen: true,
  },

  // https://github.com/reduxjs/redux-toolkit/issues/1466
  // Hide the following warning, which is not a concern:
  //   (!) `this` has been rewritten to `undefined`
  //   https://rollupjs.org/guide/en/#error-this-is-undefined
  //   node_modules/@reduxjs/toolkit/dist/redux-toolkit.esm.js
  //   1: var __extends = (this && this.__extends) || (function () {
  //                       ^
  //   2:     var extendStatics = function (d, b) {
  //   3:         extendStatics = Object.setPrototypeOf ||
  //   ...and 5 other occurrences
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
};


/**
* Main Figma plugin code
* @type {RollupOptions}
*/
const pluginOptions = {
  input: 'src/plugin/controller.ts',
  output: {
    sourcemap: !production,
    file: 'dist/plugin/code.js',
    // dir: 'dist/plugin',
    format: 'iife',
    name: 'code',
  },
  plugins: [
    resolve(),
    typescript({
      sourceMap: !production,
      tsconfig: 'tsconfig.plugin.json',
      outputToFilesystem: false,
    }),
    commonjs({ transformMixedEsModules: true }),
    production && terser(),

    del({
      targets: 'dist/plugin/*',
      runOnce: true
    }),
  ],
  watch: {
    // clearScreen: true,
  },
};

export default [
  uiOptions,
  pluginOptions,
];

function serve() {
  let started = false;

  return {
    writeBundle() {
      console.log('Serving at http://localhost:8080');

      // if (!started) {
      //   started = true;

      //   // Start localhost dev server on port 5000 to work on the UI in the browser
      //   require('child_process').spawn('npm', ['run', 'start:serve'], {
      //     stdio: ['ignore', 'inherit', 'inherit'],
      //     shell: true,
      //   });
      // }

    },
  };
}
