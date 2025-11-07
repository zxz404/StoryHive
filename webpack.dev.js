const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, 'dist')
      },
      {
        directory: path.resolve(__dirname, 'src/public')
      }
    ],
    port: 9000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
  },
  
});