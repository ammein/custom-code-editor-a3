const assert = require('assert');
const fs = require('fs-extra');
const { expect } = require('expect');
const request = require('supertest');
const _ = require('lodash');
const path = require('path');
const testUtil = require('apostrophe/test-lib/test');
const loadUtils = require('./utils.js');

describe('Custom Code Editor : Clear Modes and Push All Assets', function () {
    let originalOptionsTypes = require('../aceTypes.js');
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
                          buildDir = `${self.apos.rootDir}/apos-build/${namespace}`;
                          bundleDir = `${self.apos.rootDir}/public/apos-frontend/${namespace}`;
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

    it('should build assets folder', async function() {
      process.env.NODE_ENV = 'development';
      try {
        await apos.asset.tasks.build.task();
      } catch (error) {
        // Let it pass because the test runner will always failed to load webpack
        // due to unable to call certain webpack based on browser request
      }
      // Read All the Files that shows available mode
      let aceBuildsExists = await checkFileExists(namespace + path.posix.sep + 'ace-builds');
      expect(aceBuildsExists).toBe(true);
    });

    it('should generates all assets from custom-code-editor module from development modes', async function () {
      let modesList = apos.customCodeEditor.ace._allModes;
      let themesList = apos.customCodeEditor.ace._allThemes;
      let othersList = apos.customCodeEditor.ace._otherFiles;

      let directories = await fs.readdir(bundleDir + '/ace-builds');

      for (let i = 0; i <= directories.length; i++) {
        let dirPath = namespace + path.posix.sep + 'ace-builds' + path.posix.sep + directories[i] + path.posix.sep;
        let buildPath = namespace + path.posix.sep + 'ace-builds' + path.posix.sep + 'builds' + path.posix.sep;
        // directories = builds,modes,theme,others
        switch (directories[i]) {
          case 'modes':
            await checkFilesExists(dirPath, modesList, (exists) => {
              for (const filename in exists) {
                console.log('Check Mode Asset: ', filename);
                if (!exists[filename]) {
                  let checkBuildFolder = checkOtherFilesExists(buildPath + '/dev/' + 'mode-' + filename + '.*.js', filename);

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
                  let checkBuildFolder = checkOtherFilesExists(buildPath + '/dev/' + 'theme-' + filename + '.*.js', filename);

                  assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
                } else {
                  assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
                }
              }
            });
          break;

          case 'others':
            await checkFilesExists(dirPath, othersList, (exists) => {
              for (const filename in exists) {
                console.log('Check Others Asset: ', filename);
                if (!exists[filename]) {
                  let checkBuildFolder = checkOtherFilesExists(buildPath + '/dev/' + filename + '.*.js', filename);

                  assert(checkBuildFolder === true, `${filename}.js is still not available in builds folder.`);
                } else {
                  assert(exists[filename] === true, `${filename}.js is not available in ${directories[i]} folder.`);
                }
              }
            });
          break;
        }
      }
    });

    it('should create new apos with production build', async function() {
      await testUtil.destroy(apos);

      apos = await testUtil.create({
            // Make it `module` to be enabled because we have pushAssets method called
            root: module,
            testModule: true,
            baseUrl: 'http://localhost:7991',
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
                        buildDir = `${self.apos.rootDir}/apos-build/${namespace}`;
                        bundleDir = `${self.apos.rootDir}/public/apos-frontend/${namespace}`;
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

    it('should generates all assets from custom-code-editor module from production modes', async function() {
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