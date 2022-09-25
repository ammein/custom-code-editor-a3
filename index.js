const _ = require('lodash');
const getAceFiles = require('./getAceBuilds');
const aceFiles = getAceFiles(process.env.NODE_ENV === 'production' ? 'src-min-noconflict' : 'src-noconflict');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  options: {
    alias: 'customCodeEditor'
  },
  webpack: {
    extensions: {
      aliasModules(options) {
        return {
          resolve: {
            alias: {
              'custom-code-editor-a3/components': path.resolve(__dirname, 'ui/apos/components'),
              'custom-code-editor-a3/mixins': path.resolve(__dirname, 'ui/apos/mixins'),
              'custom-code-editor-a3/style': path.resolve(__dirname, 'ui/src')
            }
          }
        };
      },
      aceBuildsFileLoader(options) {
        return {
          // Issue solve for ace-builds replace webpack loader options: https://stackoverflow.com/questions/69406829/how-to-set-outputpath-for-inline-file-loader-imports/69407756#69407756
          // Inline Loader Syntax for RegExp: https://github.com/webpack-contrib/file-loader/issues/31
          plugins: [
            new webpack.NormalModuleReplacementPlugin(/^file-loader\?esModule=false!(.*)/, (res) => {
              const replace = process.env.NODE_ENV === 'production' ? 'file-loader?esModule=false&outputPath=ace-builds/builds&name=[name].[contenthash:16].[ext]!' : 'file-loader?esModule=false&regExp=(?:(?:.*src-min-noconflict|src-noconflict)(?:-|.*)(snippets|ext(?=-)|mode(?=-)|theme(?=-)|worker(?=-)|keybinding(?=-))(?:.*.js))&outputPath=ace-builds&name=[1]/[name].[ext]!';
              const out = res.request.replace(/^file-loader\?esModule=false!/, replace);
              res.request = out;
            })
          ]
        };
      },
      outputChunkFiles(options) {
        return {
          output: {
            chunkFormat: process.env.NODE_ENV === 'production' ? false : 'module'
          }
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
