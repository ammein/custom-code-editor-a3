const _ = require('lodash');
const getAceFiles = require('./getAceBuilds');
const aceFiles = getAceFiles('src-noconflict');
const path = require('path');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const move = require('glob-move');

module.exports = {
  options: {
    alias: 'customCodeEditor'
  },
  webpack: {
    extensionOptions: {
      aceBuildsFileLoader(options) {
        const clean = _.has(options, 'clean') ? options.clean : true;
        const cleanRelease = _.has(options, 'cleanRelease') ? options.cleanRelease : true;
        const namespace = _.has(options, 'namespace') ? options.namespace : process.env.APOS_DEBUG_NAMESPACE || 'default';
        let optionsResult = _.omitBy({
          clean: clean,
          cleanRelease: cleanRelease,
          namespace: namespace
        }, _.isNil);

        return optionsResult;
      }
    },
    extensions: {
      aceBuildsFileLoader(options) {
        return {
          plugins: [
            // Due to webpack cache issue & different path related to production/development, we need to clean some build assets to let apostrophe rebuild the files...
            process.env.NODE_ENV === 'production' ? options.clean &&
            new CleanWebpackPlugin({
              cleanAfterEveryBuildPatterns: [
                path.join(path.join(process.cwd(), 'public/apos-frontend/' + options.namespace + '/ace-builds/**')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/' + options.namespace + '/*.apos-*')),
                '!apos-*',
                '!src-*',
                '!public-*'
              ],
              cleanOnceBeforeBuildPatterns: [
                options.cleanRelease && path.join(path.join(process.cwd(), 'public/apos-frontend/releases/**/**/*.apos-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/**/*.apos-*')),
                '!apos-*',
                '!src-*',
                '!public-*'
              ]
            })
            : options.clean &&
            new CleanWebpackPlugin({
              cleanOnceBeforeBuildPatterns: [
                path.join(path.join(process.cwd(), 'public/apos-frontend/**/*.apos-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/**/apos-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/**/src-*')),
                path.join(path.join(process.cwd(), 'public/apos-frontend/**/public-*'))
              ],
              cleanAfterEveryBuildPatterns: [
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
  handlers(self, options) {
    return {
      'apostrophe:ready': {
        async moveAce() {
          if (options.apos.isTask() && (process.env.npm_lifecycle_event === 'release' || process.env.npm_lifecycle_event === 'build')) {
            // A hacky solution to move chunk files from Ace Builds to Production directory.
            // Something wrong on apostrophe that does not move ace-builds onto release directory.
            // Use copy plugin until Apostrophe came up with solution or fixes.
            try {
              await move(path.join(path.join(self.apos.rootDir, 'public/apos-frontend/**/[0-9]*.apos-*')), path.join(path.join(self.apos.rootDir, 'public/apos-frontend/releases/' + self.apos.asset.getReleaseId() + '/' + self.apos.asset.getNamespace() + '/')));
            } catch (e) {
              console.log('Unable to move Ace files to production folder', e);
            }
          }
        }
      }
    };
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