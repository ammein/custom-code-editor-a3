const assert = require('assert');
const fs = require('fs-extra');
const expect = require('expect').expect;
const request = require('supertest');
const _ = require('lodash');
const path = require('path');
const testUtil = require('apostrophe/test-lib/test');
const loadUtils = require('./utils.js');
const glob = require('glob');

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
      checkOtherFilesExists
     } = loadUtils();

    this.timeout(5 * 60 * 5000);

    before(async function() {
      await removeCache();
      await deleteBuiltFolders(publicFolderPath, true);
    });

    after(async function () {
        testUtil.destroy(apos);
    });

    it('should be a property of the apos object', async function () {
        apos = await testUtil.create({
            // Make it `module` to be enabled because we have pushAssets method called
            root: module,
            testModule: true,
            autoBuild: true,
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
                'custom-code-editor-a3': {
                  options: {
                    ace: {
                      clearModes: true
                    }
                  }
                },
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

    it('should clear all the modes options', async function() {
      expect(JSON.stringify(apos.customCodeEditor.ace.modes)).toEqual(JSON.stringify([]));
      expect(apos.customCodeEditor.ace.modes.length).toBe(0);
    });

    it('build assets folder', async function() {
      // Read All the Files that shows available mode
      let aceBuildsExists = await checkFileExists(namespace + path.posix.sep + 'ace-builds');
      expect(aceBuildsExists).toBe(true);
    });

    it('should generates all assets from custom-code-editor module', async function () {
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
                  let checkBuildFolder = checkOtherFilesExists(buildPath + 'mode-' + filename + '.*.js', filename);

                  expect(checkBuildFolder).toBe(true);
                } else {
                  expect(exists[filename]).toBe(true);
                }
              }
            });
          break;

          case 'theme':
            await checkFilesExists(dirPath, themesList, (exists) => {
              for (const filename in exists) {
                console.log('Check Theme Asset: ', filename);
                if (!exists[filename]) {
                  let checkBuildFolder = checkOtherFilesExists(buildPath + 'theme-' + filename + '.*.js', filename);

                  expect(checkBuildFolder).toBe(true);
                } else {
                  expect(exists[filename]).toBe(true);
                }
              }
            });
          break;

          case 'others':
            await checkFilesExists(dirPath, othersList, (exists) => {
              for (const filename in exists) {
                console.log('Check Others Asset: ', filename);
                if (!exists[filename]) {
                  let checkBuildFolder = checkOtherFilesExists(buildPath + filename + '.*.js', filename);

                  expect(checkBuildFolder).toBe(true);
                } else {
                  expect(exists[filename]).toBe(true);
                }
              }
            });
          break;
        }
      }
    });
});