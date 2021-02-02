const path = require('path');
const UXWebpackPlugin = require('./build/index.js');

const fileName = 'bundle.js';
const PATHS = {
  src: path.join(__dirname, './src/'),
  dist: path.join(__dirname, 'public'),
};

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    app: [path.join(__dirname, './app/index.js')],
  },
  output: {
    path: PATHS.dist,
    filename: fileName,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
    ],
  },
  watch: true,
  watchOptions: {
    ignored: '/node_modules/',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new UXWebpackPlugin(),
  ],

};
