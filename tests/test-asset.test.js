const assert = require('assert');
const fs = require('fs');
const expect = require('expect').expect;
const request = require('supertest');
const _ = require('lodash');
const path = require('path');
const testUtil = require('apostrophe/test-lib/test');
const loadUtils = require('./utils.js');

describe('Custom Code Editor : Clear Modes and Push All Assets', function () {
    let originalOptionsTypes = require('../aceTypes.js');
    let apos;
    let namespace;

    const {
      deleteBuiltFolders,
      publicFolderPath,
      checkFileExists,
      getPublicPath
     } = loadUtils();

    this.timeout(5 * 60 * 1000);

    after(async function () {
        await deleteBuiltFolders(publicFolderPath, true);
        testUtil.destroy(apos);
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
                          namespace = self.apos.asset.getNamespace()
                          assert(self.apos.schema);
                          assert(self.apos.modules['custom-code-editor-a3']);
                        }
                      }
                    }
                  }
                }
            }
        });
    });

    it('should clear all the modes options', async function() {
      expect(JSON.stringify(apos.customCodeEditor.ace.modes)).toEqual(JSON.stringify([]))
      expect(apos.customCodeEditor.ace.modes.length).toBe(0)
    })

    it('build assets folder', async function() {

        process.env.NODE_ENV = 'development';
        await apos.asset.tasks.build.task();
    });

    it('should generates all assets from custom-code-editor module', async function () {

        const buildDir = `${apos.rootDir}/apos-build/${namespace}`;
        const bundleDir = `${apos.rootDir}/public/apos-frontend/${namespace}`;
        // Read All the Files that shows available mode
        let aceBuildsExists = await checkFileExists(namespace + '/ace-builds');

        expect(aceBuildsExists).toBe(true);
    });
});