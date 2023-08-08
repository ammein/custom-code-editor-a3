const _ = require('lodash');
const getAceFiles = require('./getAceBuilds');
const aceFiles = getAceFiles(process.env.NODE_ENV === 'production' ? 'src-min-noconflict' : 'src-noconflict');
const webpack = require('webpack');
const path = require('path');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');

module.exports = {
  options: {
    alias: 'customCodeEditor'
  },
  webpack: {
    extensionOptions: {
      aceBuildsFileLoader(options) {
        const clean = _.has(options, 'clean') ? options.clean : true;
        const cleanRelease = _.has(options, 'cleanRelease') ? options.cleanRelease : true;
        const esModule = _.has(options, 'esModule') ? options.esModule : undefined;
        const releaseId = _.has(options, 'releaseId') ? options.releaseId : undefined;

        let optionsResult = _.omitBy({
          clean: clean,
          cleanRelease: cleanRelease,
          esModule: esModule,
          releaseId: releaseId
        }, _.isNil);

        return optionsResult;
      }
    },
    extensions: {
      aceBuildsFileLoader(options) {
        return {
          plugins: [
            new webpack.EnvironmentPlugin({
              NODE_ENV: process.env.NODE_ENV || 'development'
            }),
            // Due to webpack cache issue & different path related to production/development, we need to clean some build assets to let apostrophe rebuild the files...
            process.env.NODE_ENV === 'production' ? options.clean && new CleanWebpackPlugin({
              cleanAfterEveryBuildPatterns: [
                path.join(path.join(process.cwd(), 'public/apos-frontend/default/ace-builds/**')),
                '!apos-*',
                '!src-*',
                '!public-*'
              ],
              cleanOnceBeforeBuildPatterns: [
                path.join(path.join(process.cwd(), 'public/apos-frontend/default/*.apos-*'))
              ]
            }) : options.clean && new CleanWebpackPlugin({
              cleanOnceBeforeBuildPatterns: [
                path.join(path.join(process.cwd(), 'public/apos-frontend/default/*.apos-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/default/apos-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/default/src-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/default/public-*'))
              ],
              cleanAfterEveryBuildPatterns: [
                options.cleanRelease && path.join(path.join(process.cwd(), 'public/apos-frontend/releases/' + (options.releaseId || process.env.APOS_RELEASE_ID || '**') + '/default/modules/**')),
                '!apos-*',
                '!src-*',
                '!public-*'
              ]
            })
          ].filter(Boolean)
        };
      }
    }
  },
  beforeSuperClass(self) {

    const getAce = self.options.ace || {};
    _.defaults(getAce, {
      theme: '',
      defaultMode: '',
      modes: [],
      optionsTypes: {}
    });
    self.ace = getAce;
    self.ace._allModes = aceFiles.allModes;
    self.ace._allThemes = aceFiles.allThemes;
    self.ace._otherFiles = aceFiles.otherFiles;
    self.ace.optionsTypes = _.groupBy(_.merge(require('./aceTypes.js'), _.keyBy(self.ace.optionsTypes, 'name')), 'category');
    self.ace.defaultMode = self.ace.defaultMode || 'javascript';
    self.ace.theme = self.ace.theme || 'chrome';

    if (!self.ace.clearModes) {
      const extensionMode = self.ace.modes;
      const originalMode = require('./defaultMode.js');

      self.ace.modes = _.values(_.merge(_.keyBy(originalMode, 'name'), _.keyBy(extensionMode, 'name')));
    }
  },
  init(self) {

    // Initialize Custom Schema
    self.addCodeFieldType();

    // Enable Browser Data
    self.enableBrowserData();
  },
  routes(self) {
    return {
      ...require('./lib/routes')(self)
    };
  },
  methods(self) {
    return {
      ...require('./lib/schema')(self),
      ...require('./lib/routesMethod')(self)
    };
  },
  extendMethods(self) {
    return {
      ...require('./lib/browser')(self)
    };
  }
};