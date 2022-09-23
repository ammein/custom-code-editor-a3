const path = require('path');
const fs = require('fs');
const _ = require('lodash');

module.exports = (aceDirectory) => {
  const allModes = [];
  const allThemes = [];
  const otherFiles = [];
  const files = fs.readdirSync(path.join(path.dirname(require.resolve('ace-builds')), '..', aceDirectory));

  if (!files) {
    throw new Error('Did you install `ace-builds` npm package yet?');
  } else if (files) {
    // Get All Modes
    allModes
      .push(...files
        .filter((file) => file.match(/(mode)-((?!snippets)[\w]+)(.js)/))
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
        .filter((file) => file.match(new RegExp(`(?!.*${path.posix.sep})(?!.*${path.posix.sep})(.*)`, 'i')))
        .map((filteredFile) => {
          const found = filteredFile.match(/(?!.*\/)(?:(?!mode-|theme-|ace.js|snippets)(.*))*/i);

          if (!_.isUndefined(found[0]) && found[0].length > 0) {
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

  return {
    allModes,
    allThemes,
    otherFiles
  };
};
