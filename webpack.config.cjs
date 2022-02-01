'use strict';
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: {
    bundle: './src/index.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    alias: {
      "react/jsx-dev-runtime": "react/jsx-dev-runtime.js",
      "react/jsx-runtime": "react/jsx-runtime.js"
    }
  },
  output: {
    path: __dirname + '/dist/js/',
    publicPath: '/js/',
    filename: '[name].js'
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    contentBase: './dist',
    hot: true
  }
};
