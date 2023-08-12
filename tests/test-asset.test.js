/* eslint-disable no-unused-vars */
const assert = require('assert');
const fs = require('fs-extra');
const {
  expect
} = require('expect');
const path = require('path');
const testUtil = require('apostrophe/test-lib/test');
const loadUtils = require('./utils.js');
const move = require('glob-move');

describe('Custom Code Editor : Clear Modes and Push All Assets', function () {
  let apos, namespace, bundleDir;

  const {
    deleteBuiltFolders,
    publicFolderPath,
    checkFileExists,
    checkFilesExists,
    removeCache,
    checkOtherFilesExists,
    releasePath
  } = loadUtils();

  after(async function () {
    await deleteBuiltFolders(publicFolderPath, true);
    await removeCache();
    return testUtil.destroy(apos);
  });

  afterEach(async function() {
    process.env.NODE_ENV = 'development';
  });

  this.timeout(5 * 60 * 1000);

  it('should be a property of the apos object', async function () {
    apos = await testUtil.create({
      // Make it `module` to be enabled because we have pushAssets method called
      root: module,
      baseUrl: 'http://localhost:7990',
      modules: {
        'apostrophe-express': {
          options: {
            port: 7990,
            session: {
              secret: 'test-this-module'
            }
          }
        },
        'custom-code-editor-a3': {},
        testRunner: {
          handlers(self) {
            return {
              'apostrophe:afterInit': {
                checkCustomCodeEditor() {
                  namespace = self.apos.asset.getNamespace();
                  bundleDir = path.join(self.apos.rootDir, 'public', 'apos-frontend', namespace);
                  assert(self.apos.schema);
                  assert(self.apos.modules['custom-code-editor-a3']);
                }
              }
            };
          }
        }
      }
    });
  });

  it('should build assets folder', async function () {
    process.env.NODE_ENV = 'development';

    await apos.asset.tasks.build.task();

    // Read All the Files that shows available mode
    let aceBuildsExists = await checkFileExists(path.join(namespace, 'ace-builds'));
    expect(aceBuildsExists).toBe(true);
  });

  it('should generates all assets from custom-code-editor module from development modes', async function () {
    let modesList = apos.customCodeEditor.ace._allModes;
    let themesList = apos.customCodeEditor.ace._allThemes;
    let othersList = apos.customCodeEditor.ace._otherFiles;

    let directories = await fs.readdir(path.join(bundleDir, 'ace-builds/development'));

    for (let i = 0; i < directories.length; i++) {
      let dirPath = path.join(namespace, 'ace-builds/development', directories[i], path.posix.sep);
      // directories = builds,modes,theme,others
      switch (directories[i]) {
        case 'modes':
          await checkFilesExists(dirPath, modesList, (exists) => {
            for (const filename in exists) {
              console.log('Check Mode Asset: ', filename);
              if (!exists[filename]) {
                let checkExtraName = checkOtherFilesExists(path.join(dirPath, 'mode-' + filename + '.*.js'), filename);

                assert(checkExtraName === true, `${filename}.js is still cannot be found.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'snippets':
          await checkFilesExists(dirPath, modesList, (exists) => {
            for (const filename in exists) {
              console.log('Check Snippets Asset: ', filename);
              if (!exists[filename]) {
                let checkExtraName = checkOtherFilesExists(path.join(dirPath, filename + '.*.js'), filename);

                assert(checkExtraName === true, `${filename}.js is still cannot be found.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'others':
            console.log('Check Others Path Exists');
            await expect(fs.pathExists(path.join(bundleDir, 'ace-builds/development/', directories[i]))).resolves.toBe(true);
          break;
      }
    }
  });

  it('should create new apos with production build', async function () {
    await testUtil.destroy(apos);
    apos = await testUtil.create({
      // Make it `module` to be enabled because we have pushAssets method called
      root: module,
      baseUrl: 'http://localhost:7991',
      modules: {
        'apostrophe-express': {
          options: {
            port: 7991,
            session: {
              secret: 'test-this-module'
            }
          }
        },
        'custom-code-editor-a3': {},
        testRunner: {
          handlers(self) {
            return {
              'apostrophe:afterInit': {
                async checkCustomCodeEditor() {
                  namespace = self.apos.asset.getNamespace();
                  bundleDir = path.join(self.apos.rootDir, 'public', 'apos-frontend', namespace);
                  assert(self.apos.schema);
                  assert(self.apos.modules['custom-code-editor-a3']);
                }
              }
            };
          }
        }
      }
    });
  });

  it('should generates all assets from custom-code-editor module from production modes', async function () {
    await deleteBuiltFolders(publicFolderPath, true);
    process.env.APOS_RELEASE_ID = new Date().toLocaleDateString().replace(/\//g, '-');
    process.env.NODE_ENV = 'production';
    await apos.asset.tasks.build.task();

    // Temporary solution for production releases
    try {
      await move(path.join(path.join(apos.rootDir, 'public/apos-frontend/**/[0-9]*.apos-*')), path.join(path.join(apos.rootDir, 'public/apos-frontend/releases/' + apos.asset.getReleaseId() + '/' + apos.asset.getNamespace() + '/')));
    } catch (e) {
      console.log('Unable to move Ace files to production folder', e);
    }

    // Checks
    let releaseId = await releasePath();
    let checkProdBuild = await fs.pathExists(path.resolve(bundleDir, '..', releaseId));
    if (!checkProdBuild) {
      let checkReleaseDir = fs.readdirSync(path.resolve(bundleDir, '..', releaseId));
      let checkProdDir = fs.readdirSync(path.resolve(bundleDir, '..', releaseId, '..'));
      checkReleaseDir.forEach((val, i) => {
        console.log('Lists of directory in releases', i + '- ' + val);
      });

      checkProdDir.forEach((val, i) => {
        console.log('Lists of directory in prod assets folder', i + '- ' + val);
      });
    } else {
      // Temporary Tests
      let checkProdFiles = checkOtherFilesExists(path.join('/releases/', apos.asset.getReleaseId(), apos.asset.getNamespace(), '[0-9]*.apos-*'), '[\\/][0-9]*.apos-.*.[js,map]$');
      assert(checkProdFiles === true, `Production files not found in '${path.join('/releases/', apos.asset.getReleaseId(), apos.asset.getNamespace())}'`);
    }
    expect(checkProdBuild).toBe(true);
  });
});