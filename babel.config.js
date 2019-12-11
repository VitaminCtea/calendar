module.exports = function(api) {
    api.cache(true)
    const presets = [
        '@babel/preset-env',
        {
            useBuiltIns: 'usage'
        },
    ];
    const plugins = [
        '@babel/plugin-transform-arrow-functions',
        '@babel/plugin-transform-runtime'
    ];

    return {
        presets,
        plugins
    }
}