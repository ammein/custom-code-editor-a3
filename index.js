const _ = require('lodash');
const getAceFiles = require('./getAceBuilds');
const aceFiles = getAceFiles(process.env.NODE_ENV === 'development' ? 'src-noconflict' : 'src-min-noconflict');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  options: {
    alias: 'customCodeEditor',
    ace: {
      config: {
        dropdown: {
          enable: true
        }
      },
      scripts: {
        pushAllAce: true
      }
    }
  },
  webpack: {
    extensions: {
      aceBuildsFileLoader(options) {
        return {
          // Issue Solve from: https://stackoverflow.com/questions/69406829/how-to-set-outputpath-for-inline-file-loader-imports/69407756#69407756
          plugins: [
            new webpack.NormalModuleReplacementPlugin(/^file-loader\?esModule=false!(.*)/, (res) => {
              const replace = process.env.NODE_ENV === 'development' ? 'file-loader?esModule=false&outputPath=ace-builds/builds/dev&name=[name].[contenthash:16].[ext]!' : 'file-loader?esModule=false&outputPath=ace-builds/builds/prod&name=[name].[contenthash:16].[ext]!';
              const out = res.request.replace(/^file-loader\?esModule=false!/, replace);
              res.request = out;
            })
          ]
        };
      },
      renameChunkFiles(options) {
        return {
          output: {
            chunkFilename: (pathData) => {
              const getGroupType = !require.main.filename.match(new RegExp(`node_modules${path.posix.sep}mocha`)) ? new RegExp(`(?:.*${process.env.NODE_ENV === 'development' ? 'src-noconflict' : 'src-min-noconflict'}_)(?:(?<type>ext|mode|theme|worker|snippets|keybinding|.*)(?:_|-)(?<filename>.*.js))*$`, 'i') : new RegExp(`^(?:tests)(?:.*${process.env.NODE_ENV === 'development' ? 'src-noconflict' : 'src-min-noconflict'}_)(?:(?<type>ext|mode|theme|worker|snippets|keybinding|.*)(?:_|-)(?<filename>.*.js))*$`, 'i');

              const checkPathType = !_.isUndefined(pathData.chunk.id) && _.isString(pathData.chunk.id) ? pathData.chunk.id.match(getGroupType) : null;

              if (process.env.NODE_ENV === 'development' && !_.isNull(checkPathType)) {
                switch (true) {
                  case !_.isUndefined(checkPathType.groups.type) && checkPathType.groups.type === 'mode' && aceFiles.allModes.includes(checkPathType.groups.filename.replace('_js', '')):
                    return 'ace-builds/modes/mode-' + checkPathType.groups.filename.replace('_js', '.js');

                  case !_.isUndefined(checkPathType.groups.type) && checkPathType.groups.type === 'theme' && aceFiles.allThemes.includes(checkPathType.groups.filename.replace('_js', '')):
                    return 'ace-builds/theme/theme-' + checkPathType.groups.filename.replace('_js', '.js');

                  case !_.isUndefined(checkPathType.groups.type) && checkPathType.groups.type === 'snippets':
                    return 'ace-builds/others/' + checkPathType.groups.type + '/' + checkPathType.groups.filename.replace('_js', '.js');

                  default:
                    return 'ace-builds/others/' + checkPathType.groups.type + '/' + checkPathType.groups.type + '-' + checkPathType.groups.filename.replace('_js', '.js');
                }
              } else if (process.env.NODE_ENV === 'production') {
                return 'ace-builds/production-builds/[id].js';
              }
            }
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
