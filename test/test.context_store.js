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

const assert = require('assert');
const utils = require('../lib/middleware/utils');
const Botkit = require('botkit');
const sinon = require('sinon');
const MemoryStorage = require('botbuilder').MemoryStorage;
const WebAdapter = require('botbuilder-adapter-web').WebAdapter;

describe('context', function () {
  const message = {
    'type': 'message',
    'channel': 'D2BQEJJ1X',
    'user': 'U2BLZSKFG',
    'text': 'Hello there!',
    'ts': '1475776074.000004',
    'team': 'T2BM5DPJ6'
  };

  const conversation_response = {
    'intents': [],
    'entities': [],
    'input': {
      'text': 'Hello there!'
    },
    'output': {
      'log_messages': [],
      'text': [
        'Hi. It looks like a nice drive today. What would you like me to do? '
      ],
      'nodes_visited': [
        'node_1_1467221909631'
      ]
    },
    'context': {
      'conversation_id': '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      'system': {
        'dialog_stack': [
          'root'
        ],
        'dialog_turn_counter': 1,
        'dialog_request_counter': 1
      },
      'default_counter': 0
    }
  };


  const adapter = new WebAdapter({});
  const controller = new Botkit.Botkit({
    adapter: adapter,
    storage: new MemoryStorage(), //specifying storage explicitly eliminates 3 lines of warning output
    authFunction: function() {} //eliminates 1 line of warning output
  });

  const storage = controller.storage;

  describe('readContext()', function () {
    it('should read context correctly', function () {
      return utils.readContext(message, storage).then(function (context) {
        assert.deepEqual(context, null, 'Actual context: ' + JSON.stringify(context) + '\ndoes not match expected context: ' + null);
      });
    });

    it('should suppress storage error', function () {
      const storageStub = sinon.stub(storage, 'read').rejects('error message');

      return utils.readContext(message, storage).then(function() {
        storageStub.restore();
      }).catch(function (err) {
        storageStub.restore();
        throw err;
      });
    });
  });

  describe('updateContext()', function () {
    it('should store context of the first response', function () {

      var itemId = 'user.' + message.user;
      return utils.updateContext(message.user, storage, conversation_response).then(function () {
        return storage.read([itemId]);
      }).then(function (data) {
        assert.deepEqual(data[itemId].context, conversation_response.context, 'Updated store: ' + JSON.stringify(data[itemId].context) + '\ndoes not match expected store: ' + JSON.stringify(conversation_response.context));
      });
    });

    it('should ignore storage error on read when user is not saved yet', function () {
      const storageStub1 = sinon.stub(storage, 'read').rejects(new Error('error message'));
      const storageStub2 = sinon.stub(storage, 'write').resolves();

      const watsonResponse = {
        context: {
          a: 1
        }
      };
      return utils.updateContext('NEWUSER3', storage, watsonResponse).then(function (response) {
        assert.equal(response, watsonResponse);
        storageStub1.restore();
        storageStub2.restore();
      }).catch(function () {
        storageStub1.restore();
        storageStub2.restore();
      });
    });

    it('should return storage error on write', function () {
      const storageStub = sinon.stub(storage, 'write').rejects('error message');

      utils.updateContext(message.user, storage, conversation_response).then(function (err) {
        assert.equal(err, 'error message', 'Error was not passed to callback');
        storageStub.restore();
      }).catch(function () {
        storageStub.restore();
      });
    });

    it('should update existing context', function () {
      const firstContext = {
        'a': 1,
        'b': 2
      };
      const secondContext = {
        'c': 3,
        'd': 4
      };
      //first update
      return utils.updateContext(message.user, storage, {
        context: firstContext
      }).then(function () {
        //second update
        return utils.updateContext(message.user, storage, {
          context: secondContext
        });
      }).then(function () {
        return storage.read(['user.U2BLZSKFG']);
      }).then(function (data) {
        assert.deepEqual(data['user.U2BLZSKFG'].context, secondContext, 'Updated context: ' + JSON.stringify(data['user.U2BLZSKFG'].context) + '\ndoes not match expected context: ' + JSON.stringify(secondContext));
      });
    });

    it('should preserve other data in storage', function () {
      const user = {
        'id': 'U2BLZSKFX',
        'profile': {
          'age': 23,
          'sex': 'male'
        }
      };

      const newContext = {
        'a': 1,
        'b': 2
      };

      var itemId = 'user.' + user.id;

      var existingData = {};
      existingData[itemId] = user;

      return storage.write(existingData).then(function () {
        return utils.updateContext(user.id, storage, {
          context: newContext
        });
      }).then(function () {
        return storage.read([itemId]);
      }).then(function (data) {
        assert.deepEqual(data[itemId].profile, user.profile, 'Profile was not preserved: ' + JSON.stringify(data[itemId].profile) + '\ndoes not match: ' + JSON.stringify(user.profile));
        assert.deepEqual(data[itemId].context, newContext, 'Updated context: ' + JSON.stringify(data[itemId].context) + '\ndoes not match expected context: ' + JSON.stringify(newContext));
      });
    });
  });
});
