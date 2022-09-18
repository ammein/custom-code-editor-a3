let assert = require('assert');
const testUtil = require('apostrophe/test-lib/test');
const { expect } = require('expect');

describe('Custom Code Editor : Basic Schema Test', function() {
    let apos;
    this.timeout(5 * 60 * 5000);

    after(async function () {
      return testUtil.destroy(apos);
    });

    it('should be a property of the apos object', async function () {
        apos = await testUtil.create({
            // Make it `module` to be enabled because we have pushAssets method called
            root: module,
            testModule: true,
            baseUrl: 'http://localhost:7992',
            modules: {
                'apostrophe-express': {
                  options: {
                    port: 7992,
                    session: {
                      secret: 'test-this-module-code'
                    }
                  }
                },
                'custom-code-editor-a3': {},
                testRunner: {
                  handlers(self) {
                    return {
                      'apostrophe:afterInit': {
                        checkCustomCodeEditor() {
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

    it('should submit the schema with empty object and must not return an error', async function() {
        let req = apos.task.getReq();
        let schema = apos.schema.compose({
            addFields: [{
                type: 'custom-code-editor',
                name: 'mycode',
                label: 'Paste your code here'
            }]
        });
        let output = {};
        await apos.schema.convert(req, schema, {}, output);
        expect(output.mycode).toBe(null);
    });

    it('should always return string value even the submitted value is undefined', async function() {
        let req = apos.task.getReq();
        let schema = apos.schema.compose({
            addFields: [{
                type: 'custom-code-editor',
                name: 'mycode',
                label: 'Paste your code here'
            }]
        });
        let output = {};
        await apos.schema.convert(req, schema, {
            mycode: {
                code: apos.launder.string(undefined),
                type: apos.launder.string(undefined)
            }
        }, output);

        expect(output).toMatchObject({
          mycode: {
            code: '',
            type: ''
          }
        });
    });

    it('should trigger an error if the field is required with empty value', async function() {
        let req = apos.task.getReq();
        let schema = apos.schema.compose({
            addFields: [{
                type: 'custom-code-editor',
                name: 'mycode',
                label: 'Paste your code here',
                required: true
            }]
        });

        let output = {};
        await expect(apos.schema.convert(req, schema, {}, output)).rejects.not.toThrow();
    });

    it('should not trigger any error if value present on required field', async function() {
        let req = apos.task.getReq();
        let schema = apos.schema.compose({
            addFields: [{
                type: 'custom-code-editor',
                name: 'mycode',
                label: 'Paste your code here',
                required: true
            }]
        });

        let output = {};

        await apos.schema.convert(req, schema, {
            mycode: {
                code: '<html></html>',
                type: 'html'
            }
        }, output);

        expect(output).toMatchObject({
          mycode: {
            code: '<html></html>',
            type: 'html'
          }
        });
    });

    it('should not panicked even the value is absent for code', async function() {
        let req = apos.task.getReq();
        let schema = apos.schema.compose({
            addFields: [{
                type: 'custom-code-editor',
                name: 'mycode',
                label: 'Paste your code here',
                required: true
            }]
        });

        let output = {};

        await apos.schema.convert(req, schema, {
            mycode: {
                code: '',
                type: 'html'
            }
        }, output);

        expect(output).toMatchObject({
          mycode: {
            code: '',
            type: 'html'
          }
        });
    });
});