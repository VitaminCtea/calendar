const merge = require('webpack-merge')
const common = require('./webpack.common')
const path = require('path')

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
        extensions: ['.ts', '.js', '.sass', '.css'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'helper': path.resolve(__dirname, 'src/helper'),
            'core': path.resolve(__dirname, 'src/core'),
            'public': path.resolve(__dirname, 'src/public'),
            'types': path.resolve(__dirname, 'src/types'),
            'style': path.resolve(__dirname, 'src/style')
        }
    }
})
