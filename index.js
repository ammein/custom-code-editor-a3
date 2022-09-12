const _ = require('lodash');
const getAceFiles = require('./getAceBuilds');
const aceDirectory = 'src-noconflict';
const aceFiles = getAceFiles(aceDirectory);
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
              const getGroupType = !require.main.filename.match(new RegExp(`node_modules${path.posix.sep}mocha`)) ? /(?:.*src-noconflict_)(?:(?<type>ext|mode|theme|worker|snippets|keybinding|.*)(?:_|-)(?<filename>.*.js))*$/i : /^(?:tests)(?:.*src-noconflict_)(?:(?<type>ext|mode|theme|worker|snippets|keybinding|.*)(?:_|-)(?<filename>.*.js))*$/i;

              const checkPathType = pathData.chunk.id.match(getGroupType);

              /**
               * TODO:
               * ```
               * assets by path ace-builds/builds/*.js 13.9 MiB
                    asset ace-builds/builds/worker-xquery.a67a135f8ecea4dc.js 3.34 MiB [emitted] [immutable] [from: tests/node_modules/custom-code-editor-a3/node_modules/ace-builds/src-noconflict/worker-xquery.js] (auxiliary name: main)
                    + 438 assets
                  assets by path ace-builds/others/ 279 KiB
                    assets by path ace-builds/others/snippets/*.js 226 KiB 132 assets
                    assets by path ace-builds/others/ext/*.js 53.8 KiB 11 assets
                  assets by path ace-builds/modes/*.js 287 KiB
                    asset ace-builds/modes/mode-latex.js 10.4 KiB [emitted] 1 related asset
                    asset ace-builds/modes/mode-c9search.js 10.4 KiB [emitted] 1 related asset
                    + 40 assets
                  assets by path ace-builds/theme/*.js 99.3 KiB
                    asset ace-builds/theme/theme-iplastic.js 8.04 KiB [emitted] 1 related asset
                    asset ace-builds/theme/theme-dracula.js 5.37 KiB [emitted] 1 related asset
                    + 22 assets
                  asset apos-build.js 9.44 MiB [emitted] (name: main) 1 related asset
                  runtime modules 8.15 KiB 13 modules
                  orphan modules 443 bytes [orphan] 1 module
                  modules by path ./node_modules/ 4.45 MiB 1695 modules
                  modules by path ./tests/ 15.5 MiB
                    modules by path ./tests/node_modules/custom-code-editor-a3/node_modules/ace-builds/src-noconflict/ 14.6 MiB 880 modules
                    modules by path ./tests/node_modules/custom-code-editor-a3/node_modules/vue-material-design-icons/*.vue 37.8 KiB
                      ./tests/node_modules/custom-code-editor-a3/node_modules/vue-material-design-icons/ClipboardMultiple.vue 1.24 KiB [built] [code generated]
                      + 54 modules
                    modules by path ./tests/apos-build/default/ 155 KiB 22 modules
                    modules by path ./tests/node_modules/custom-code-editor-a3/ui/apos/ 128 KiB
                      ./tests/node_modules/custom-code-editor-a3/ui/apos/components/CustomCodeEditor.vue 1.32 KiB [built] [code generated]
                      + 14 modules
                    ./tests/node_modules/custom-code-editor-a3/node_modules/lodash/lodash.js 531 KiB [built] [code generated]
                    ./tests/node_modules/custom-code-editor-a3/node_modules/ace-builds/webpack-resolver.js 50.9 KiB [built] [code generated]
                    ./tests/node_modules/custom-code-editor-a3/node_modules/clipboard/dist/clipboard.js 26.2 KiB [built] [code generated]

                  ERROR in webpack/runtime/get javascript chunk filename
                  Cannot read properties of null (reading 'groups')

                  ERROR in Cannot read properties of null (reading 'groups')
                  ```
               */
              switch (checkPathType !== null) {
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
