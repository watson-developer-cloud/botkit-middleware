/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var assert = require('assert');
var Botkit = require('botkit');
var nock = require('nock');
var sinon = require('sinon');


describe('Promise', function() {

  //Watson Conversation params
  var service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: 'v1',
    version_date: '2016-09-20'
  };
  var workspace_id = 'zyxwv-54321';
  var path = '/v1/workspaces/' + workspace_id + '/message';

  // Botkit params
  var controller = Botkit.slackbot();
  var bot = controller.spawn({
    token: 'abc123'
  });
  var message = {
    "type": "message",
    "channel": "D2BQEJJ1X",
    "user": "U2BLZSKFG",
    "text": "hi",
    "ts": "1475776074.000004",
    "team": "T2BM5DPJ6"
  };

  var config = service;
  config.workspace_id = workspace_id;
  var middleware = require('../lib/middleware/index')(config);
  var storage = bot.botkit.storage;
  middleware.storage = storage;

  before(function() {
    nock.disableNetConnect();
  });

  after(function() {
    nock.cleanAll();
  });

  describe('returned by readContext', function() {
    it('resolves with empty object when user does not exist in storage', function(done) {
      middleware.readContext('XXXXXXXXXX').then(function(result) {
        assert.deepEqual(result, {});
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('resolves with data object when user exists in storage', function(done) {
      middleware.updateContext('XXXXXXXXXX', {'data': 555}).then(function() {
        return middleware.readContext('XXXXXXXXXX');
      }).then(function (result) {
          assert.deepEqual(result, {'data': 555});
          done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('resolves with empty object when storage returns error', function(done) {
      var storageStub = sinon.stub(storage.users, 'get').yields('error message');

      middleware.readContext('XXXXXXXXXX').then(function(result) {
        assert.deepEqual(result, {});
        done();
      }).catch(function(err) {
        done(err);
      });
    });
  });

  describe('returned by updateContext', function() {
    it('resolves when context is stored', function(done) {
      middleware.updateContext('XXXXXXXXXX', {'data': 555}).then(function() {
        done();
      }).catch(function(err) {
        done(err);
      });
    });
    it('rejects when storage returns error', function(done) {
      var storageStub = sinon.stub(storage.users, 'save').yields('error message');

      middleware.updateContext('XXXXXXXXXX', {'data': 555}).catch(function(err) {
        assert.equal(err, 'error message', 'Unexpected error message');
        storageStub.restore();
        done();
      }).catch(function(err) {
        done(err);
      });
    });
  });

  describe('returned by sendToWatson', function() {
    it('4always resolves', function(done) {
      middleware.sendToWatson(bot, message, null).then(function () {
        done();
      }).catch(function(err) {
        done(err);
      });
    });
  });
});
