// webpack.config.js
module.exports = {
    entry: [ './src/index.js' ],
    output: {
        filename: 'bundle.js',
        libraryTarget: 'var',
        library: 'Epsagon'
    },
    mode: "production",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|\.test\.[tj]sx?$)/,
            }
        ]
    },
    resolve: { extensions: ['.ts', '.js', '.json'] },
};
