const path = require('path');
const fs = require('fs-extra')
const loadUtils = function() {
  const publicFolderPath = path.join(process.cwd(), 'tests/public');
  const deleteBuiltFolders = async (publicPath, deleteAposBuild = false) => {
    await fs.remove(publicPath + '/apos-frontend');
    await fs.remove(publicPath + '/uploads');

    if (deleteAposBuild) {
      await fs.remove(path.join(process.cwd(), 'test/apos-build'));
    }
  };
  const getPublicPath = (p) => `${publicFolderPath}/apos-frontend/` + p;
  const checkFileExists = async (p) => fs.pathExists(getPublicPath(p));

  return {
    publicFolderPath,
    deleteBuiltFolders,
    getPublicPath,
    checkFileExists
  }
}

module.exports = loadUtils