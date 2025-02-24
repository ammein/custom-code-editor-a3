/* eslint-disable no-unused-vars */
const assert = require('assert');
const { readdir, pathExists, readdirSync } = require('fs-extra');
const { expect } = require('expect');
const { join, posix, resolve } = require('path');
const { destroy, create } = require('apostrophe/test-lib/test')
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
    return destroy(apos);
  });

  afterEach(async function () {
    process.env.NODE_ENV = 'development';
  });

  this.timeout(5 * 60 * 1000);

  it('should be a property of the apos object', async function () {
    apos = await create({
      // Make it `module` to be enabled because we have pushAssets method called
      root: module,
      testModule: true,
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
                  bundleDir = join(self.apos.rootDir, 'public', 'apos-frontend', namespace);
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
    const aceBuildsExists = await checkFileExists(join(namespace, 'ace-builds'));
    expect(aceBuildsExists).toBe(true);
  });

  it('should generates all assets from custom-code-editor module from development modes', async function () {
    const modesList = apos.customCodeEditor.ace._allModes;
    const themesList = apos.customCodeEditor.ace._allThemes;
    const othersList = apos.customCodeEditor.ace._otherFiles;

    const directories = await readdir(join(bundleDir, 'ace-builds/development'));

    for (let i = 0; i < directories.length; i++) {
      const dirPath = join(namespace, 'ace-builds/development', directories[i], posix.sep);
      // directories = builds,modes,theme,others
      switch (directories[i]) {
        case 'modes':
          await checkFilesExists(dirPath, modesList, (exists) => {
            for (const filename in exists) {
              console.log('Check Mode Asset: ', filename);
              if (!exists[filename]) {
                const checkExtraName = checkOtherFilesExists(join(dirPath, 'mode-' + filename + '.*.js'), filename);

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
                const checkExtraName = checkOtherFilesExists(join(dirPath, filename + '.*.js'), filename);

                assert(checkExtraName === true, `${filename}.js is still cannot be found.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'others':
          console.log('Check Others Path Exists');
          await expect(pathExists(join(bundleDir, 'ace-builds/development/', directories[i]))).resolves.toBe(true);
          break;
      }
    }
  });

  it('should create new apos with production build', async function () {
    await destroy(apos);
    apos = await create({
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
                  bundleDir = join(self.apos.rootDir, 'public', 'apos-frontend', namespace);
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
      await move(join(join(apos.rootDir, 'public/apos-frontend/**/[0-9]*.apos-*')), join(join(apos.rootDir, 'public/apos-frontend/releases/' + apos.asset.getReleaseId() + '/' + apos.asset.getNamespace() + '/')));
    } catch (e) {
      console.log('Unable to move Ace files to production folder', e);
    }

    // Checks
    const releaseId = await releasePath();
    const checkProdBuild = await pathExists(resolve(bundleDir, '..', releaseId));
    if (!checkProdBuild) {
      const checkReleaseDir = readdirSync(resolve(bundleDir, '..', releaseId));
      const checkProdDir = readdirSync(resolve(bundleDir, '..', releaseId, '..'));
      checkReleaseDir.forEach((val, i) => {
        console.log('Lists of directory in releases', i + '- ' + val);
      });

      checkProdDir.forEach((val, i) => {
        console.log('Lists of directory in prod assets folder', i + '- ' + val);
      });
    } else {
      // Temporary Tests
      const checkProdFiles = checkOtherFilesExists(join('/releases/', apos.asset.getReleaseId(), apos.asset.getNamespace(), '[0-9]*.apos-*'), '[\\/][0-9]*.apos-.*.[js,map]$');
      assert(checkProdFiles === true, `Production files not found in '${join('/releases/', apos.asset.getReleaseId(), apos.asset.getNamespace())}'`);
    }
    expect(checkProdBuild).toBe(true);
  });
});