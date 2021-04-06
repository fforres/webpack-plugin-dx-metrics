const path = require('path');
const UXWebpackPlugin = require('./build/src/index.js');

const fileName = 'bundle.js';
const PATHS = {
  src: path.join(__dirname, './src/'),
  dist: path.join(__dirname, 'public'),
};

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  cache: true,
  entry: {
    app: [path.join(__dirname, './app/index.js')],
  },
  output: {
    path: PATHS.dist,
    filename: fileName,
    publicPath: '/',
  },
  // watch: true,
  // watchOptions: {
  //   ignored: '/node_modules/',
  // },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: 'defaults' }]],
          },
        },
      },
    ],
  },
  devServer: {
    publicPath: '/',
    hot: true,
    historyApiFallback: {
      index: '/',
    },
    onListening: (server) => {
      // const port = server.listeningApp.address().port;
      // const { localUrlForBrowser } = prepareUrls(
      //   protocol,
      //   HOST,
      //   port || DEFAULT_PORT,
      // );
      // openBrowser(localUrlForBrowser);
    },
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new UXWebpackPlugin({
      projectName: 'some-name',
      dryRun: true,
      datadogConfig: {
        apiKey: 'some-key',
        /* SOME DATADOG API KEY FROM https://<YOUR_ORG>.datadoghq.com/account/settings#api */
      },
    }),
  ],
};
