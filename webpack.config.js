const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript').default;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');
const path = require('path');
const { writeFile } = require('fs/promises');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;
  const previewEnv = env.PREVIEW_ENV;
  const appEnv = env.APP_ENV || 'production';
  const isBrowser = previewEnv === 'browser';
  // If not production and not browser, it's a normal dev env in Figma.

  // Update manifest.json with the bundle folder name.
  const distFolder = 'build';
  // const distFolder = 'build';
  if (isProduction) {
    editJsonFile('./manifest.json', manifest => {
      const { main, ui } = manifest;
      const mainSplit = manifest.main.split('/');
      mainSplit[0] = distFolder;
      manifest.main = mainSplit.join('/');
      const uiSplit = manifest.ui.split('/');
      uiSplit[0] = distFolder;
      manifest.ui = uiSplit.join('/');

      manifest.name = 'Clapy';
      manifest.id = '1062567834134269';
    }).catch(e => {
      console.error('Error while building webpack, previewEnv:', previewEnv);
      console.error(e);
    });
  }


  return {
    mode: isProduction ? 'production' : 'development',

    // This is necessary because Figma's 'eval' works differently than normal eval
    devtool: isProduction ? false : 'inline-source-map',

    entry: {
      front: './src/index.tsx', // The entry point for your UI code
      ...(!isBrowser && {
        backend: './src/backend/backend.ts', // The entry point for your plugin backend
      }),
    },

    devServer: {
      static: {
        directory: path.join(__dirname, distFolder),
      },
      open: true,
      hot: true,
      historyApiFallback: true,
      port: 9000,
    },

    module: {
      rules: [
        // Converts TypeScript code to JavaScript
        {
          test: /\.tsx?$/,
          include: path.join(__dirname, 'src'),
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                getCustomTransformers: () => ({
                  before: [isDevelopment && isBrowser && ReactRefreshTypeScript()].filter(Boolean),
                }),
              }
            }
          ],
        },

        // Enables including CSS by doing "import './file.css'" in your TypeScript code
        {
          test: /\.(sa|sc|c)ss$/i, use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
            // Compiles Sass to CSS
            "sass-loader",
          ]
        },

        // Allows you to use "import logo from './logo.svg'" in TypeScript to get a data URI
        { test: /\.(png|jpg|gif|webp|svg|zip)$/, use: [{ loader: 'url-loader' }] },
      ],
    },

    // Webpack tries these extensions for you if you omit the extension like "import './file'"
    resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, distFolder), // Compile into a folder called "build"
    },

    // Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
    plugins: [
      isDevelopment && isBrowser && new ReactRefreshPlugin(),
      isBrowser && new ForkTsCheckerWebpackPlugin(),
      new HtmlWebpackPlugin({
        inject: "body",
        template: './src/index.html',
        filename: 'index.html',
        inlineSource: '.(js)$',
        chunks: ['front'],
        cache: false,
      }),
      !isBrowser && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/front/]),
      new webpack.DefinePlugin({
        'process.env': {
          PREVIEW_ENV: JSON.stringify(previewEnv),
          APP_ENV: JSON.stringify(appEnv),
        },
      }),
    ].filter(Boolean),
  };
};

async function editJsonFile(fileName, editor) {
  let file = require(fileName);
  editor(file);
  await writeFile(fileName, JSON.stringify(file, null, 2));
}