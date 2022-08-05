const _ = require('lodash');
const fs = require('fs');
const path = require('path');

module.exports = {
  options: {
    alias: 'customCodeEditor',
  },
  beforeSuperClass(self) {
    const aceDirectory = 'src-noconflict';
    const allModes = [];
    const allThemes = [];
    const otherFiles = [];
    const files = fs.readdirSync(path.resolve(path.dirname(require.resolve('ace-builds')), `../${aceDirectory}`));

    if (!files) {
      throw self.apos.error('Did you install `ace-builds` npm package yet?');
    } else if (files) {
      // Get All Modes
      allModes
        .push(...files
          .filter((file) => file.match(/(mode)-([\w]+)(.js)/))
          .map((filteredFile) => {
            const found = filteredFile.match(/(?<mode>[mode]+)-(?<filename>[\w]+)(?<extension>.js)/);

            if (found) {
              return found.groups.filename;
            }

            return null;
          })
          .filter(Boolean));

      otherFiles
        .push(...files
          .filter((file) => file.match(new RegExp(`(?!.*${path.sep})(?!.*${path.sep})(.*)`, 'i')))
          .map((filteredFile) => {
            const found = filteredFile.match(/(?!.*\/)(?:(?!mode-|theme-|ace.js|worker-|snippets)(.*))*/i);

            if (found) {
              return found[0];
            }

            return null;

          })
          .filter(Boolean));

      // Get All Themes
      allThemes
        .push(...files
          .filter((file) => file.match(/(theme)-([\w]+)(.js)/))
          .map((filteredFile) => {
            const found = filteredFile.match(/(?<theme>[theme]+)-(?<filename>[\w]+)(?<extension>.js)/);

            if (found) {
              return found.groups.filename;
            }

            return null;

          }).filter(Boolean));
    }

    const getAce = self.options.ace || {};
    _.defaults(getAce, {
      theme: '',
      defaultMode: '',
      modes: [],
      optionsTypes: {}
    });
    self.ace = getAce;
    self.ace._allModes = allModes;
    self.ace._allThemes = allThemes;
    self.ace._otherFiles = otherFiles;
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
