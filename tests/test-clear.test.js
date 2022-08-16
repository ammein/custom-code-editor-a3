let assert = require('assert');
let async = require('async');
let fs = require('fs');
const expect = require('expect');
const request = require('supertest');
const _ = require('lodash');
const path = require('path');
const testUtil = require('apostrophe/test-lib/test');

describe('Custom Code Editor : Clear Modes and Push All Assets', function () {
    let originalOptionsTypes = require('../aceTypes');
    let apos;

    // Apostrophe took some time to load
    // Ends everything at 50 seconds
    this.timeout(50000);

    after(async function () {
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
                          apos = self.apos;
                          assert(apos.schema);
                          assert(apos.modules['custom-code-editor-a3']);
                        }
                      }
                    }
                  }
                }
            }
        });
    });

    it('should clear all the modes options', function() {
        expect(JSON.stringify(apos.customCodeEditor.ace.modes)).toEqual(JSON.stringify([]))
        expect(apos.customCodeEditor.ace.modes.length).toBe(0)
    })

    it('should received all the modes when "pushAllAce" is defined', function(done) {
        // Read All the Files that shows available mode
        let pathPublicAce = path.join(__dirname, '/../public/js/ace');
        let allModes = [];
        let extractModeRegex = new RegExp('[^mode-](.*)', 'g')
        fs.readdirSync(pathPublicAce).filter(function(value, i, arr) {
            if (value.match(/mode-/g)) {
              allModes.push(value.match(extractModeRegex)[0])
            }
        })
        for (let i = apos.assets.pushed.scripts.length - 1; i >= 0; i--) {
            let web = apos.assets.pushed.scripts[i].web
            let file = apos.assets.pushed.scripts[i].file

            if (web.match(/custom-code-editor/g)) {
                if (file.match(/mode-/g)) {
                    allModes.forEach(function(mode, i, arr) {
                        let regex = new RegExp('mode-' + mode, 'g')
                        let anyMode = new RegExp('(mode-.*)$', 'g');
                        if (file.match(regex)) {
                            expect(file.match(anyMode)).toEqual([
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