const assert = require('assert');
const fs = require('fs-extra');
const {
  expect
} = require('expect');
const request = require('supertest');
const _ = require('lodash');
const path = require('path');
const testUtil = require('apostrophe/test-lib/test');
const loadUtils = require('./utils.js');

describe('Custom Code Editor : Clear Modes and Push All Assets', function () {
  let apos, namespace, buildDir, bundleDir;

  const {
    deleteBuiltFolders,
    publicFolderPath,
    checkFileExists,
    checkFilesExists,
    getPublicPath,
    removeCache,
    cacheFolderPath,
    checkOtherFilesExists,
    releasePath
  } = loadUtils();

  this.timeout(5 * 60 * 5000);

  after(async function () {
    await deleteBuiltFolders(publicFolderPath, true);
    await removeCache();
    return testUtil.destroy(apos);
  });

  it('should be a property of the apos object', async function () {
    apos = await testUtil.create({
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
                  buildDir = path.join(self.apos.rootDir, 'apos-build', namespace);
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
    try {
      await apos.asset.tasks.build.task();
    } catch (error) {
      // Let it pass because the test runner will always failed to load webpack
      // due to unable to call certain webpack based on browser request
    }
    // Read All the Files that shows available mode
    let aceBuildsExists = await checkFileExists(path.join(namespace, 'ace-builds'));
    expect(aceBuildsExists).toBe(true);
  });

  it('should generates all assets from custom-code-editor module from development modes', async function () {
    let modesList = apos.customCodeEditor.ace._allModes;
    let themesList = apos.customCodeEditor.ace._allThemes;
    let othersList = apos.customCodeEditor.ace._otherFiles;

    let directories = await fs.readdir(path.join(bundleDir, 'ace-builds'));

    for (let i = 0; i < directories.length; i++) {
      let dirPath = path.join(namespace, 'ace-builds', directories[i], path.posix.sep);
      let buildPath = path.join(namespace, 'ace-builds', 'builds', path.posix.sep);
      // directories = builds,modes,theme,others
      switch (directories[i]) {
        case 'mode':
          await checkFilesExists(dirPath, modesList, (exists) => {
            for (const filename in exists) {
              console.log('Check Mode Asset: ', filename);
              if (!exists[filename]) {
                let checkBuildFolder = checkOtherFilesExists(path.join(buildPath, 'mode-' + filename + '.*.js'), filename);

                assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'theme':
          await checkFilesExists(dirPath, themesList, (exists) => {
            for (const filename in exists) {
              console.log('Check Theme Asset: ', filename);
              if (!exists[filename]) {
                let checkBuildFolder = checkOtherFilesExists(path.join(buildPath, 'theme-' + filename + '.*.js'), filename);

                assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'ext':
          await checkFilesExists(dirPath, othersList.filter((p) => p.match(directories[i])), (exists) => {
            for (const filename in exists) {
              console.log('Check Extension Asset: ', filename);
              if (!exists[filename]) {
                let checkBuildFolder = checkOtherFilesExists(path.join(buildPath, filename + '.*.js'), filename);

                assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'keybinding':
          await checkFilesExists(dirPath, othersList.filter((p) => p.match(new RegExp('(?!ext-)?' + directories[i] + '(?=-)'))), (exists) => {
            for (const filename in exists) {
              console.log('Check Keybinding Asset: ', filename);
              if (!exists[filename]) {
                let checkBuildFolder = checkOtherFilesExists(path.join(buildPath, filename + '.*.js'), filename);

                assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
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
                let checkBuildFolder = checkOtherFilesExists(path.join(buildPath, filename + '.*.js'), filename);

                assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'worker':
          await checkFilesExists(dirPath, othersList.filter((p) => p.match(directories[i])), (exists) => {
            for (const filename in exists) {
              console.log('Check Worker Asset: ', filename);
              if (!exists[filename]) {
                let checkBuildFolder = checkOtherFilesExists(path.join(buildPath, filename + '.*.js'), filename);

                assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
              } else {
                assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
              }
            }
          });
          break;

        case 'vendors':
            console.log('Check Vendors Path Exists');
            await expect(fs.pathExists(path.join(bundleDir, 'ace-builds', directories[i]))).resolves.toBe(true);
          break;
      }
    }
  });

  it('should create new apos with production build', async function () {
    await testUtil.destroy(apos);

    apos = await testUtil.create({
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
                  buildDir = path.join(self.apos.rootDir, 'apos-build', namespace);
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
    process.env.NODE_ENV = 'production';

    try {
      await apos.asset.tasks.build.task();
    } catch (error) {
      // Do nothing
    }
    let releaseId = await releasePath();
    let checkProdBuild = await checkFileExists(releaseId);
    expect(checkProdBuild).toBe(true);
  });
});