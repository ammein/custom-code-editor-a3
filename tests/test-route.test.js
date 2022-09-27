const assert = require('assert');
const testUtil = require('apostrophe/test-lib/test');
const {
  expect
} = require('expect');
const _ = require('lodash');

describe('Custom Code Editor : Routes GET/POST/DELETE Options', function () {

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

  it('should be able to insert a new user as admin', async function () {
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

  it('should log in as admin user', async function() {
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

    // Save options
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

    // Check user options from db
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

  it('should get previous saves options', async function () {
    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);

    // Get Options
    try {
      const result = await apos.http.get(apos.customCodeEditor.action + '/options', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
      expect(result.status).toBe('success');
      expect(JSON.parse(result.message)).toMatchObject(body.customCodeEditor);
      expect(Object.keys(result).length).toBe(2);
    } catch (e) {
      assert(!e);
    }

    // Check user options from db
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

  it('should reset options successfully using DELETE route', async function () {
    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);

    // Delete Options
    try {
      const result = await apos.http.delete(apos.customCodeEditor.action + '/remove', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
      expect(result.status).toBe('success');
      expect(result.message).toEqual('Successfully delete all options');
      expect(Object.keys(result).length).toBe(2);
    } catch (e) {
      assert(!e);
    }

    // Check user options from db
    try {
      const checkUser = await apos.user.find(req, {
        username: 'abuBakar'
      }).toObject();

      expect(checkUser.customCodeEditor).toBe(undefined);
      expect(checkUser.username).toBe('abuBakar');
    } catch (e) {
      assert(!e);
    }
  });

  it('should get empty saves options after removed all the options', async function () {
    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);

    try {
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
    } catch (e) {
      assert(!e);
    }

  });

  it('should save user options successfully - second time', async function () {
    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);
    req.body = _.cloneDeep(body);

    // Save options
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

    // Check user options from db
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

  it('should not submit wrong key value to save and must maintain the saves value', async function () {
    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    let cloneBody = _.cloneDeep(body);
    req.user = _.assign(existingUser, myUser);
    req.body = {
      'NotCustomCodeEditor': cloneBody.customCodeEditor
    };

    // Save options
    try {
      expect(apos.permission.can(req, 'edit')).toBe(true);

      await apos.http.post(apos.customCodeEditor.action + '/submit', {
        send: 'json',
        body: _.cloneDeep(req.body),
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
    } catch (err) {
      assert(err);
      expect(JSON.parse(err)).toMatchObject({
        status: 'error',
        message: 'Unable to save your options'
      });
    }

    // Check user options from db
    try {
      const checkUser = await apos.user.find(req, {
        username: 'abuBakar'
      }).toObject();

      expect(checkUser.customCodeEditor).toMatchObject(body.customCodeEditor);
      expect(checkUser['NotCustomCodeEditor']).not.toBeTruthy();
      expect(checkUser['NotCustomCodeEditor']).toBeFalsy();
      expect(checkUser.username).toBe('abuBakar');
    } catch (e) {
      assert(!e);
    }
  });

  it('should reset options successfully using DELETE route - second time', async function () {
    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);

   // Delete Options
    try {
      const result = await apos.http.delete(apos.customCodeEditor.action + '/remove', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
      expect(result.status).toBe('success');
      expect(result.message).toEqual('Successfully delete all options');
      expect(Object.keys(result).length).toBe(2);
    } catch (e) {
      assert(!e);
    }

    // Check user options from db
    try {
      const checkUser = await apos.user.find(req, {
        username: 'abuBakar'
      }).toObject();

      expect(checkUser.customCodeEditor).toBe(undefined);
      expect(checkUser.username).toBe('abuBakar');
    } catch (e) {
      assert(!e);
    }
  });

  it('should be able to insert a new user as guest', async function () {
    assert(apos.user.newInstance);
    let user = apos.user.newInstance();
    assert(user);

    user.firstName = 'Lala';
    user.lastName = 'Move';
    user.title = 'Lala Move';
    user.username = 'lalamove';
    user.password = 'lalapassword123';
    user.email = 'lalamove@move.com';
    user.role = 'guest';

    assert(user.type === '@apostrophecms/user');
    assert(apos.user.insert);

    await expect(apos.user.insert(apos.task.getReq(), user)).resolves.not.toThrow();
    dummyUser = user;
  });

  it('should log out admin user before login new guest user', async function() {
    try {
      await apos.http.post(
        '/api/v1/@apostrophecms/login/logout',
        {
          body: {
            username: 'abuBakar',
            password: '123password'
          },
          headers: {
            Authorization: `Bearer ${token}`
          },
          jar
        }
      );
    } catch (e) {
      assert(!e);
    }
  });

  it('should log in as guest user', async function() {
    jar = apos.http.jar();

    let response = await apos.http.post('/api/v1/@apostrophecms/login/login', {
      body: {
        username: dummyUser.username,
        password: 'lalapassword123'
      }
    });
    expect(response).toBeTruthy();
    expect(response.token).toEqual(expect.anything());
    token = response.token;
  });

  it('should not get guest user save options on customCodeEditor', async function () {
    try {
      await apos.http.get(apos.customCodeEditor.action + '/options', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
    } catch (e) {
      expect(e).toMatchObject({
        status: 'error',
        message: 'Unable to get existing options'
      });
      expect(Object.keys(e).length).toBe(2);
    }
  });

  it('should not save user options as guest user', async function () {

    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);
    req.body = _.cloneDeep(body);

    // Save options
    try {
      expect(apos.permission.can(req, 'edit')).toBe(false);
      expect(apos.permission.can(req, 'view')).toBe(true);

      await apos.http.post(apos.customCodeEditor.action + '/submit', {
        send: 'json',
        body: _.cloneDeep(body),
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
    } catch (err) {
      assert(err);
      expect(JSON.parse(err)).toMatchObject({
        status: 'error',
        message: 'Unable to save your options'
      });
    }

    // Check user options from db
    try {
      req = apos.task.getAdminReq();
      const checkUser = await apos.user.find(req, {
        username: 'lalamove'
      }).toObject();

      expect(checkUser.customCodeEditor).toBe(undefined);
      expect(checkUser.username).toBe('lalamove');
    } catch (e) {
      assert(!e);
    }
  });

  it('should not able to reset user options as guest user', async function () {

    let req = apos.task.getReq();
    let existingUser = _.cloneDeep(req.user);
    let myUser = _.cloneDeep(dummyUser);
    req.user = _.assign(existingUser, myUser);
    req.body = _.cloneDeep(body);

    // Save options
    try {
      expect(apos.permission.can(req, 'edit')).toBe(false);
      expect(apos.permission.can(req, 'view')).toBe(true);

      await apos.http.delete(apos.customCodeEditor.action + '/remove', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        jar
      });
    } catch (err) {
      assert(err);
      expect(JSON.parse(err)).toMatchObject({
        status: 'error',
        message: 'Unable to delete options'
      });
    }

    // Check user options from db
    try {
      req = apos.task.getAdminReq();
      const checkUser = await apos.user.find(req, {
        username: 'lalamove'
      }).toObject();

      expect(checkUser.customCodeEditor).toBe(undefined);
      expect(checkUser.username).toBe('lalamove');
    } catch (e) {
      assert(!e);
    }
  });
});