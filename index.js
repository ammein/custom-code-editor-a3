const _ = require('lodash');
const getAceFiles = require('./getAceBuilds');
const aceDirectory = 'src-noconflict';
const aceFiles = getAceFiles(aceDirectory);
const webpack = require('webpack');

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
              const out = res.request.replace(/^file-loader\?esModule=false!/, 'file-loader?esModule=false&outputPath=ace-builds/builds&name=[name].[hash:16].[ext]!');
              res.request = out;
            })
          ]
        };
      },
      renameChunkFiles(options) {
        return {
          output: {
            chunkFilename: (pathData) => {
              const getGroupType = /(?:.*src-noconflict_)(?:(?<type>ext|mode|theme|worker|snippets|keybinding|.*)(?:_|-)(?<filename>.*.js))*$/i;

              const checkPathType = pathData.chunk.id.match(getGroupType);

              switch (true) {
                case checkPathType.groups.type === 'mode' && aceFiles.allModes.includes(checkPathType.groups.filename.replace('_js', '')):
                  return 'ace-builds/modes/mode-' + checkPathType.groups.filename.replace('_js', '.js');

                case checkPathType.groups.type === 'theme' && aceFiles.allThemes.includes(checkPathType.groups.filename.replace('_js', '')):
                  return 'ace-builds/theme/theme-' + checkPathType.groups.filename.replace('_js', '.js');

                case checkPathType.groups.type === 'snippets':
                  return 'ace-builds/others/' + checkPathType.groups.type + '/' + checkPathType.groups.filename.replace('_js', '.js');

                default:
                  return 'ace-builds/others/' + checkPathType.groups.type + '/' + checkPathType.groups.type + '-' + checkPathType.groups.filename.replace('_js', '.js');
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
