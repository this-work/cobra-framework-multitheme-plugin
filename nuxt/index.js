/**
 * Cobra-Framework Multitheme nuxt 2.13+ integration
 *
 * Version 1.0.0
 * Author Tobias Wöstmann
 *
 */

import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import webpack from 'webpack';

export default function(moduleOptions) {

    const { nuxt } = this;
    const nuxtConfig = nuxt.options;
    const defaultTheme = nuxtConfig._env.CONFIG_THEME;
    const themeFolderPath = path.join(nuxtConfig.alias.assets, 'theme');
    const staticCssFolderPath = path.join(nuxtConfig.alias.static, 'css');
    const additionalThemes = getThemeNames(themeFolderPath, defaultTheme);

    let nuxtWebpackConfig = {};
    let multiThemeWebpackConfig = {};

    /**
     * Hook into the nuxt build to get the webpack configuration
     */
    this.nuxt.hook('webpack:config', webpackConfigs => {

        nuxtWebpackConfig = webpackConfigs[0];

    });

    this.nuxt.hook('build:compiled', ({ stats }) => {

        const themePlaceholder = "{{THEME}}";

        const webpackScssEntrys = getStyleFilesFromStats(stats).map((scssPath) => {
            return scssPath.replace('/theme/' + defaultTheme, '/theme/' + themePlaceholder);
        });

        multiThemeWebpackConfig = createMultiThemeWebpackConfig(nuxtWebpackConfig, webpackScssEntrys, themePlaceholder, nuxtConfig);

        _.each(additionalThemes, (theme, key) => {
            const compiler = webpack(replaceValueInDeepObject(themePlaceholder, theme, multiThemeWebpackConfig));
            compiler.run((err, stats) => {});
        });

    });

}

function getThemeNames(themeFolderPath, exceptTheme = null) {
    return fs.readdirSync(themeFolderPath).filter(theme => {
        return fs.statSync(themeFolderPath + '/' + theme).isDirectory() && exceptTheme !== theme;
    });
}

function replaceValueInDeepObject(searchPhrase, replaceString, object) {
    const newObject = _.clone(object);
    _.each(object, (val, key) => {
        if (typeof(val) === 'string' && val.indexOf(searchPhrase) > -1) {
            newObject[key] = newObject[key].replace(searchPhrase, replaceString);
        } else if (typeof(val) === 'object' || typeof(val) === 'array') {
            newObject[key] = replaceValueInDeepObject(searchPhrase, replaceString, val);
        }
    });
    return newObject;
}

function addMinifyCssRuleOption(searchPhrase,  object) {
    const newObject = _.clone(object);
    _.each(object, (val, key) => {
        if (typeof(val) === 'object' && val.hasOwnProperty('loader') && val.loader.indexOf(searchPhrase) > -1) {
            if (val.options.hasOwnProperty('sassOptions')) {
                val.options.sassOptions['outputStyle'] = 'compressed';
            } else {
                val.options['sassOptions'] = {
                    outputStyle: 'compressed'
                }
            }
        } else if (typeof(val) === 'object' || typeof(val) === 'array') {
            newObject[key] = addMinifyCssRuleOption(searchPhrase, val);
        }
    });
    return newObject;
}

function createMultiThemeWebpackConfig(originWebpackConfig, entrys, themePlaceholder, nuxtConfig) {

    const multiThemeWebpackConfig = {};

    const plugins = filterWebpackPlugins(originWebpackConfig, themePlaceholder);
    const filteredRules = [
        originWebpackConfig.module.rules[5],
        originWebpackConfig.module.rules[6],
        originWebpackConfig.module.rules[7]
    ]

    const webpackRules = addMinifyCssRuleOption(
        '/node_modules/sass-loader/',
        replaceValueInDeepObject(
            '/theme/' + nuxtConfig._env.CONFIG_THEME,
            '/theme/' + themePlaceholder,
            filteredRules
        )
    );

    multiThemeWebpackConfig.name = originWebpackConfig.name;
    multiThemeWebpackConfig.mode = originWebpackConfig.mode;
    multiThemeWebpackConfig.devtool = originWebpackConfig.devtool;
    multiThemeWebpackConfig.entry = entrys;
    multiThemeWebpackConfig.output = {
        "path": path.join(nuxtConfig.alias.static, 'css' ),
        "filename": themePlaceholder + ".css",
        'chunkFilename': themePlaceholder + ".css",
    };
    multiThemeWebpackConfig.optimization = {
        splitChunks: {
            "maxSize": 999999999,
            "chunks": "all",
            "name": false,
            "cacheGroups": {
                "styles": {
                    "test": /\.scss$/,
                    "filename": themePlaceholder + ".css",
                    "chunks": "all",
                    "enforce": true
                }
            }
        },
        "runtimeChunk": "single",
        "minimize": false
    };
    multiThemeWebpackConfig.performance = originWebpackConfig.performance;
    multiThemeWebpackConfig.module = {
        rules: webpackRules
    }
    multiThemeWebpackConfig.plugins = plugins;
    multiThemeWebpackConfig.resolve = {
        plugins: originWebpackConfig.resolve.plugins,
        modules: originWebpackConfig.resolve.modules
    };
    multiThemeWebpackConfig.resolveLoader = {
        plugins: originWebpackConfig.resolveLoader.plugins,
        modules: originWebpackConfig.resolveLoader.modules
    };

    return multiThemeWebpackConfig;

}

function getStyleFilesFromStats(stats) {

    const regex = /(\/partials\/|\/pages\/|\/layouts\/|(\/assets\/theme\/(.*?)\/scss\/base))(.*?)(\.scss)/g;
    // const regex = /(\/partials\/|\/pages\/|\/layouts\/|(\/assets\/theme\/(.*?)\/scss\/base))(.*?)(\.scss|\.vue)/g; // For future vue file scanning

    return [...stats.compilation.fileDependencies].filter(dependency => {
        return typeof dependency === 'string' && dependency.search(regex) > -1
    });

}

function filterWebpackPlugins(webpackConfig, themePlaceholder) {

    return webpackConfig.plugins.filter(plugin => {

        return plugin.constructor.name === 'ExtractCssChunksPlugin' ||
            plugin.constructor.name === 'TimeFixPlugin'

    }).map(plugin => {

        if (plugin.constructor.name === 'ExtractCssChunksPlugin') {
            plugin.options = {
                "ignoreOrder": false,
                "chunkFilename": themePlaceholder + ".css",
                "insert": null
            };
        }

        return plugin;

    });
}
