const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const loadUtils = function() {
  const publicFolderPath = path.join(process.cwd(), path.join('tests', 'public'));

  const deleteBuiltFolders = async (publicPath, deleteAposBuild = false) => {
    await fs.remove(path.join(publicPath, 'apos-frontend'));
    await fs.remove(path.join(publicPath, 'uploads'));

    if (deleteAposBuild) {
      await fs.remove(path.join(process.cwd(), 'tests', 'apos-build'));
    }
  };

  const removeCache = async (loc) => {
    await fs.remove(loc || cacheFolderPath);
  };

  const cacheFolderPath = process.env.APOS_ASSET_CACHE || path.join(process.cwd(), 'tests', 'data', 'temp', 'webpack-cache');

  const getPublicPath = (p) => path.join(publicFolderPath, 'apos-frontend', p);

  const checkFileExists = async (p) => fs.pathExists(getPublicPath(p));

  const checkOtherFilesExists = (p, filename) => {
    let regex = new RegExp(filename, 'i');
    let files = glob.sync(path.join(publicFolderPath, 'apos-frontend', p));
    if (files.some(e => regex.test(e))) {
      return true;
    }
    return false;
  };

  const checkFilesExists = async (p, arr, callback) => {
    let fileExists = {};

    for (let i = 0; i < arr.length; i++) {
      let getDir = new RegExp(`([^${path.posix.sep}]*)${path.posix.sep}*$`, 'i');

      if (p.match(getDir) === undefined) {
        return callback(arr[i], false);
      }

      switch (p.match(getDir)[1]) {
        case 'snippets':
          fileExists[path.posix.basename(arr[i], '.js')] = await fs.pathExists(getPublicPath(p + arr[i] + '.js'));
          break;

        case 'mode':
          fileExists[path.posix.basename(arr[i], '.js')] = await fs.pathExists(getPublicPath(p + 'mode-' + arr[i] + '.js'));
        break;

        case 'theme':
          fileExists[path.posix.basename(arr[i], '.js')] = await fs.pathExists(getPublicPath(p + 'theme-' + arr[i] + '.js'));
        break;

          default:
            fileExists[path.posix.basename(arr[i], '.js')] = await fs.pathExists(getPublicPath(p + arr[i]));
      }
    }
    return callback(fileExists);
  };

  const getReleaseId = async () => fs.readdir(getPublicPath('releases'));
  const releasePath = async () => {
    const getReleaseIdPath = await getReleaseId();
    const returnPath = path.join('releases', typeof getReleaseIdPath !== 'string' ? getReleaseIdPath[0] : getReleaseIdPath, 'default', path.posix.sep);
    return returnPath;
  };

  return {
    publicFolderPath,
    deleteBuiltFolders,
    getPublicPath,
    checkFileExists,
    checkFilesExists,
    removeCache,
    cacheFolderPath,
    checkOtherFilesExists,
    releasePath
  };
};

module.exports = loadUtils;