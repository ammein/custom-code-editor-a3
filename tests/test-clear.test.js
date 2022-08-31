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
                    },
                    scripts: {
                      pushAllAce: true
                    }
                  }
                },
                testRunner: {
                  handlers(self) {
                    return {
                      'apostrophe:afterInit': {
                        checkCustomCodeEditor() {
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

    it('should received all the modes when "pushAllAce" is defined', async function() {

        async function checkBundlesExists (folderPath, fileNames) {
          for (const fileName of fileNames) {
            const modeFileExists = await checkFileExists(folderPath + fileName + '.js.apos-build.js');
            assert(modeFileExists);
          }
        }

        process.env.NODE_ENV = 'development';
        await apos.asset.tasks.build.task();
        // Read All the Files that shows available mode
        return checkBundlesExists(apos.asset.getNamespace() + '/tests_node_modules_custom-code-editor-a3_node_modules_ace-builds_src-noconflict_mode-', apos.customCodeEditor.ace._allModes);
        // let pathPublicAce = path.join(__dirname, '/../public/js/ace');
        // let allModes = [];
        // let extractModeRegex = new RegExp('[^mode-](.*)', 'g')
        // fs.readdirSync(pathPublicAce).filter(function(value, i, arr) {
        //     if (value.match(/mode-/g)) {
        //       allModes.push(value.match(extractModeRegex)[0])
        //     }
        // })
        // for (let i = apos.assets.pushed.scripts.length - 1; i >= 0; i--) {
        //     let web = apos.assets.pushed.scripts[i].web
        //     let file = apos.assets.pushed.scripts[i].file

        //     if (web.match(/custom-code-editor/g)) {
        //         if (file.match(/mode-/g)) {
        //             allModes.forEach(function(mode, i, arr) {
        //                 let regex = new RegExp('mode-' + mode, 'g')
        //                 let anyMode = new RegExp('(mode-.*)$', 'g');
        //                 if (file.match(regex)) {
        //                     expect(file.match(anyMode)).toEqual([
        //                         expect.stringMatching(regex)
        //                     ])
        //                 } else if (!file.match(regex)) {
        //                     expect(file.match(regex)).toBeNull()
        //                 }
        //             })
        //         }
        //     }
        // }
    });

    it('should get all the themes when "pushAllAce" is defined ', function (done) {
        // Read All the Files that shows available mode
        let pathPublicAce = path.join(__dirname, '/../public/js/ace');
        let allThemes = []
        let extractModeRegex = new RegExp('[^theme-](.*)', 'g')
        fs.readdirSync(pathPublicAce).filter(function (value, i, arr) {
            if (value.match(/theme-/g)) {
                allThemes.push(value.match(extractModeRegex)[0])
            }
        })
        for (let i = apos.assets.pushed.scripts.length - 1; i >= 0; i--) {
            let web = apos.assets.pushed.scripts[i].web
            let file = apos.assets.pushed.scripts[i].file

            if (web.match(/custom-code-editor/g)) {
                if (file.match(/theme-/g)) {
                    allThemes.forEach(function (theme, i, arr) {
                        let regex = new RegExp('theme-' + theme, 'g');
                        let anyTheme = new RegExp('(theme-.*)$', 'g');
                        if (file.match(regex)) {
                            expect(file.match(anyTheme)).toEqual([
                                expect.stringMatching(regex)
                            ])
                        } else if (!file.match(regex)) {
                            expect(file.match(regex)).toBeNull()
                        }
                    })
                }
            }
        }

        done();
    });
});