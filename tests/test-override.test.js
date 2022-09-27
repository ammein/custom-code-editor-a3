const assert = require('assert');
const testUtil = require('apostrophe/test-lib/test');
const {
  expect
} = require('expect');
const _ = require('lodash');

describe('Custom Code Editor : Override Options Test', function () {
  let originalOptionsTypes = require('../aceTypes');
  let apos;

  let snippetCSS = '/* This is CSS3 */ \n { box-sizing : border-box; \n font : inherit; } \n \n @code-here';
  let snippetBatch = '# Welcome to Command Prompt \n # Enter Any Command Here \n @code-here';

  let originalModes = [{
      title: 'Bash',
      name: 'sh',
      snippet: `#!/bin/bash
                     # GNU bash, version 4.3.46
                     @code-here`
    },
    {
      title: 'ActionScript',
      name: 'actionscript'
    },
    {
      title: 'C++',
      name: 'c_cpp',
      snippet: `//Microsoft (R) C/C++ Optimizing Compiler Version 19.00.23506 for x64

                        #include <iostream>

                        int main()
                        {
                           @code-here
                        }`
    },
    {
      title: 'C#',
      name: 'csharp',
      snippet: `//Rextester.Program.Main is the entry point for your code. Don't change it.
                     //Compiler version 4.0.30319.17929 for Microsoft (R) .NET Framework 4.5

                     using System;
                     using System.Collections.Generic;
                     using System.Linq;
                     using System.Text.RegularExpressions;

                     namespace Rextester
                     {
                        public class Program
                        {
                           public static void Main(string[] args)
                           {
                                 // code goes here
                                 @code-here
                           }
                        }
                     }`
    },
    {
      name: 'php',
      snippet: `<html>
                     <head>
                     <title>PHP Test</title>
                     </head>
                     <body>
                     <?php //code goes here
                        @code-here
                     ?> 
                     </body>
                     </html>`
    },
    {
      name: 'html',
      snippet: `<!DOCTYPE html>
            <html>
            <head>
            <title>
            <!-- Title Here -->
            </title>
            </head>
            <body>
            <!-- Code-here -->
            @code-here
            </body>
            </html>`
    },
    {
      name: 'javascript',
      snippet: `document.addEventListener("DOMContentLoaded" , function(){
               @code-here
            });`
    }
  ];

  this.timeout(5 * 60 * 5000);

  after(async function () {
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
        'custom-code-editor-a3': {
          options: {
            ace: {
              theme: 'monokai',
              defaultMode: 'html',
              options: {
                'enableBasicAutocompletion': true
              },
              modes: [{
                  title: 'CSS',
                  name: 'css',
                  snippet: snippetCSS
                },
                {
                  title: 'html',
                  name: 'html'
                },
                {
                  title: 'Command Prompt',
                  name: 'batchfile',
                  snippet: snippetBatch
                }
              ],
              config: {
                dropdown: {
                  enable: true,
                  height: 30,
                  borderRadius: 5,
                  fontFamily: 'Mont-Regular',
                  fontSize: 16,
                  position: {
                    bottom: 20,
                    right: 20
                  },
                  arrowColor: 'yellow'
                }
              }
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
            };
          }
        }
      }
    });
  });

  it('should get all the ace options to be the same', function () {
    expect(apos.customCodeEditor.ace).toMatchObject({
      _allModes: apos.customCodeEditor.ace._allModes,
      _allThemes: apos.customCodeEditor.ace._allThemes,
      _otherFiles: apos.customCodeEditor.ace._otherFiles,
      theme: 'monokai',
      defaultMode: 'html',
      options: {
        'enableBasicAutocompletion': true
      },
      modes: _.values(_.merge(_.keyBy(originalModes, 'name'), _.keyBy([{
          title: 'CSS',
          name: 'css',
          snippet: snippetCSS
        },
        {
          title: 'html',
          name: 'html'
        },
        {
          title: 'Command Prompt',
          name: 'batchfile',
          snippet: snippetBatch
        }
      ], 'name'))),
      optionsTypes: _.groupBy(originalOptionsTypes, 'category'),
      config: {
        dropdown: {
          enable: true,
          height: 30,
          borderRadius: 5,
          fontFamily: 'Mont-Regular',
          fontSize: 16,
          position: {
            bottom: 20,
            right: 20
          },
          arrowColor: 'yellow'
        }
      }
    });
  });

  it('should not match with hardcoded modes', function () {
    expect(apos.customCodeEditor.ace.modes).not.toMatchObject(_.assign(_.cloneDeep(originalModes), {
      test: {
        errorObj: 'error'
      }
    }));
  });
});