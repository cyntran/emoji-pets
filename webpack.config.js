const HtmlWebPackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: ['@babel/polyfill', './src/index.js'],
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'docs/')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          { loader: "babel-loader" }
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    })
  ]
}
