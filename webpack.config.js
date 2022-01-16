const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
var glob = require("glob");

const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

module.exports = {
    context: ROOT,

    entry: {
        'main': './index.js',
    },

    output: {
        filename: '[name].bundle.js',
        path: DESTINATION
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ],
        fallback: {
            "crypto": false,
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer")
        }
    },

    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'assets', to: 'assets' },
                { from: 'index.html', to: 'index.html'}
            ]
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],

    module: {
        rules: [
            /****************
            * PRE-LOADERS
            *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'tslint-loader'
            },

            /****************
            * LOADERS
            *****************/
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: 'awesome-typescript-loader'
            }
        ]
    },

    devtool: 'cheap-module-source-map',
    devServer: {
        historyApiFallback: true,
        static: path.resolve(__dirname, './src'),
        hot: true,
        port: 8080
    }
};

