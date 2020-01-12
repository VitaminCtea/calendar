const webpack = require('webpack')
const express = require('express')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const app = express()
const webpackConfig = require('./webpack.dev')
const compiler = webpack(webpackConfig)
const port = 9999

app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
}))

app.use(webpackHotMiddleware(compiler, {
    log: false,
    heartbeat: 2000
}))

app.listen(port, function () {
    console.log(`Calendar app listening on port ${ port }!`)
})