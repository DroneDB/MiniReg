const VueLoaderPlugin = require('vue-loader/lib/plugin');
const path = require('path');

module.exports = {
    mode: 'development',
    
    entry: path.join(__dirname, './webapp/js/main.js'),
    
    output: {
        path: path.join(__dirname, './webapp/public/build/'),
        filename: "[name].js",
        publicPath: "/build/"
    },

    module: {
        rules: [
            {
                test: /\.vue$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        'scss': [
                            'vue-style-loader',
                            'css-loader',
                            'sass-loader'
                        ]
                    }
                }
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: ['@babel/env']
                        }
                    }
                ],
            },
            {
                test: /\.s?css$/,
                use: [
                    {
                        loader: "vue-style-loader" // creates style nodes from JS strings
                    },
                    {
                        loader: "css-loader" // translates CSS into CommonJS
                    },
                    {
                        loader: "sass-loader" // compiles Sass to CSS
                    }
                ]
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg|jpg|gif)$/, 
                loader: 'url-loader?limit=100000' 
            }
        ]
    },
    plugins: [
        new VueLoaderPlugin()
    ],

    externals: {
        "ddb": "DDB"
    }
}
