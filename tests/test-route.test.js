const assert = require('assert');
const testUtil = require('apostrophe/test-lib/test');
const {
  expect
} = require('expect');
const _ = require('lodash');

describe('Custom Code Editor : Routes Saving Options', function () {

  let dummyUser, apos, jar, token;
  let body = {
    'customCodeEditor': {
      'enableEmmet': true
    }
  };
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
              options: {
                'enableBasicAutocompletion': true
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
                  assert(self.apos.user.safe.remove);
                }
              }
            };
          }
        }
      }
    });
  });

  // Test pieces.newInstance()
  it('should be able to insert a new user', async function () {
    assert(apos.user.newInstance);
    let user = apos.user.newInstance();
    assert(user);

    user.firstName = 'Abu';
    user.lastName = 'Bakar';
    user.title = 'Abu Bakar';
    user.username = 'abuBakar';
    user.password = '123password';
    user.email = 'abu@dummy.com';
    user.role = 'admin';

    assert(user.type === '@apostrophecms/user');
    assert(apos.user.insert);

    await expect(apos.user.insert(apos.task.getAdminReq(), user)).resolves.not.toThrow();
    dummyUser = user;
  });

  it('should log in as dummy user', async function() {
    jar = apos.http.jar();

    let response = await apos.http.post('/api/v1/@apostrophecms/login/login', {
      body: {
        username: dummyUser.username,
        password: '123password'
      }
    });
    expect(response).toBeTruthy();
    expect(response.token).toEqual(expect.anything());
    token = response.token;
  });

  it('should get empty user save options on customCodeEditor', async function () {
    const result = await apos.http.get(apos.customCodeEditor.action + '/options', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      jar
     });
    expect(result).toMatchObject({
      status: 'empty',
      message: '{}'
    });
    expect(Object.keys(result).length).toBe(2);
  });

  it('should save user options successfully', async function () {

    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);
    req.body = _.cloneDeep(body);

    try {
      expect(apos.permission.can(req, 'edit')).toBe(true);

      const saved = await apos.http.post(apos.customCodeEditor.action + '/submit', {
        send: 'json',
        body: _.cloneDeep(body),
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });

      expect(saved).toMatchObject({
        status: 'success',
        message: 'All options saved'
      });
    } catch (err) {
      assert(!err);
    }

    try {
      const checkUser = await apos.user.find(req, {
        username: 'abuBakar'
      }).toObject();

      expect(checkUser.customCodeEditor).toMatchObject(body.customCodeEditor);
      expect(checkUser.username).toBe('abuBakar');
    } catch (e) {
      assert(!e);
    }
  });

  // it('should get previous saves options', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   req.user = _.assign(existingUser, myUser);
  //   apos.customCodeEditor.getOptions(req, function (err, result) {
  //     if (err) {
  //       console.log('ERROR (GET) : ', err);
  //     }
  //     assert(!err);
  //     expect(result).toMatchObject(body.customCodeEditor);
  //     expect(Object.keys(result).length).toBe(1);
  //     // Check User Database to be match with customCodeEditor saving options
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       if (err) {
  //         console.log('ERROR (USER GET) : ', err);
  //       }
  //       assert(!err);
  //       // Must match with the result
  //       expect(user.customCodeEditor).toMatchObject(result);
  //       assert(user.username === 'abuBakar');
  //       done();
  //     });
  //   });
  // });

  // it('should reset options successfully using DELETE route', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   req.user = _.assign(existingUser, myUser);

  //   apos.customCodeEditor.removeOptions(req, function (err) {
  //     if (err) {
  //       console.log('ERROR (DELETE) : ', err);
  //     }
  //     assert(!err);
  //     // Check user to see if it is truly removes all the options
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       if (err) {
  //         console.log('ERROR (USER DELETE) : ', err);
  //       }
  //       assert(!err);
  //       assert(user.username === 'abuBakar');
  //       expect(user['customCodeEditor']).toBe(undefined);
  //       done();
  //     });
  //   });
  // });

  // it('should get empty saves options after removed all the options', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   req.user = _.assign(existingUser, myUser);
  //   apos.customCodeEditor.getOptions(req, function (err, result) {
  //     if (err) {
  //       console.log('ERROR (GET) : ', err);
  //     }
  //     assert(!err);
  //     expect(result).toMatchObject({});
  //     expect(Object.keys(result).length).toBe(0);
  //     done();
  //   });
  // });

  // it('should save user options successfully - second time', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   req.user = _.assign(existingUser, myUser);
  //   req.body = _.cloneDeep(body);
  //   apos.customCodeEditor.submit(req, function (err) {
  //     if (err) {
  //       console.log('ERROR (POST) : ', err);
  //     }
  //     assert(!err);
  //     // Check User Database to be match with customCodeEditor saving options
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       if (err) {
  //         console.log('ERROR (USER POST) : ', err);
  //       }
  //       assert(!err);
  //       expect(user.customCodeEditor).toMatchObject(body.customCodeEditor);
  //       assert(user.username === 'abuBakar');
  //       done();
  //     });
  //   });
  // });

  // it('should not submit wrong key value to save and must maintain the saves value', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   let cloneBody = _.cloneDeep(body);
  //   req.user = _.assign(existingUser, myUser);
  //   req.body = {
  //     'NotCustomCodeEditor': cloneBody.customCodeEditor
  //   };
  //   apos.customCodeEditor.submit(req, function (err) {
  //     assert(!err);

  //     // Check User Database to be available
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       assert(!err);
  //       expect(user.username).toBe('abuBakar');
  //       expect(user.customCodeEditor).toMatchObject(body.customCodeEditor);
  //       expect(user['NotCustomCodeEditor']).not.toBeTruthy();
  //       expect(user['NotCustomCodeEditor']).toBeFalsy();

  //       apos.customCodeEditor.getOptions(req, function (err, result) {
  //         assert(!err);
  //         expect(result).toMatchObject(body.customCodeEditor);
  //         done();
  //       });
  //     });
  //   });
  // });

  // it('should reset options successfully using DELETE route - second time', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   req.user = _.assign(existingUser, myUser);

  //   apos.customCodeEditor.removeOptions(req, function (err) {
  //     if (err) {
  //       console.log('ERROR (DELETE) : ', err);
  //     }
  //     assert(!err);
  //     // Check user to see if it is truly removes all the options
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       if (err) {
  //         console.log('ERROR (USER DELETE) : ', err);
  //       }
  //       assert(!err);
  //       assert(user.username === 'abuBakar');
  //       expect(user['customCodeEditor']).toBe(undefined);
  //       done();
  //     });
  //   });
  // });

  // it('should not submit wrong key value to save and must return nothing', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   let cloneBody = _.cloneDeep(body);
  //   req.user = _.assign(existingUser, myUser);
  //   req.body = {
  //     'NotCustomCodeEditor': cloneBody.customCodeEditor
  //   };
  //   apos.customCodeEditor.submit(req, function (err) {
  //     assert(!err);

  //     // Check User Database to be available
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       assert(!err);
  //       expect(user.username).toBe('abuBakar');
  //       expect(user.customCodeEditor).toBe(null);
  //       expect(user['NotCustomCodeEditor']).not.toBeTruthy();
  //       expect(user['NotCustomCodeEditor']).toBeFalsy();

  //       apos.customCodeEditor.getOptions(req, function (err, result) {
  //         assert(!err);
  //         expect(result).toMatchObject({});
  //         done();
  //       });
  //     });
  //   });
  // });

  // it('should save user options successfully - last time', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   req.user = _.assign(existingUser, myUser);
  //   req.body = _.cloneDeep(body);
  //   apos.customCodeEditor.submit(req, function (err) {
  //     if (err) {
  //       console.log('ERROR (POST) : ', err);
  //     }
  //     assert(!err);
  //     // Check User Database to be match with customCodeEditor saving options
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       if (err) {
  //         console.log('ERROR (USER POST) : ', err);
  //       }
  //       assert(!err);
  //       expect(user.customCodeEditor).toMatchObject(body.customCodeEditor);
  //       assert(user.username === 'abuBakar');
  //       done();
  //     });
  //   });
  // });

  // it('should not saves wrong key value and must maintain the saves value', function (done) {
  //   let req = apos.task.getReq();
  //   let existingUser = _.cloneDeep(req.user);
  //   let myUser = _.cloneDeep(dummyUser);
  //   let cloneBody = _.cloneDeep(body);
  //   req.user = _.assign(existingUser, myUser);
  //   req.body = {
  //     'NotCustomCodeEditor': {
  //       'highlightActiveLine': false
  //     }
  //   };
  //   apos.customCodeEditor.submit(req, function (err) {
  //     assert(!err);

  //     // Check User Database to be available
  //     apos.user.find(req, {
  //       username: 'abuBakar'
  //     }).toObject(function (err, user) {
  //       assert(!err);
  //       expect(user.username).toBe('abuBakar');
  //       expect(user.customCodeEditor).toMatchObject(body.customCodeEditor);
  //       expect(user['NotCustomCodeEditor']).not.toBeTruthy();
  //       expect(user['NotCustomCodeEditor']).toBeFalsy();

  //       apos.customCodeEditor.getOptions(req, function (err, result) {
  //         assert(!err);
  //         expect(result).toMatchObject(body.customCodeEditor);
  //         done();
  //       });
  //     });
  //   });
  // });
});