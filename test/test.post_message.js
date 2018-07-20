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
var utils = require('../lib/middleware/utils');
var nock = require('nock');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');

describe('conversation()', function () {

  //Watson Conversation params
  var service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: '2018-07-10'
  };
  var workspace = 'zyxwv-54321';
  var path = '/v1/workspaces/' + workspace + '/message';
  var conversation = new ConversationV1(service);

  before(function () {
    nock.disableNetConnect();
  });

  after(function () {
    nock.cleanAll();
  });

  it('should initiate a conversation', function (done) {
    var expected = {
      'intents': [],
      'entities': [],
      'input': {
        'text': 'hi'
      },
      'output': {
        'log_messages': [],
        'text': [
          'Hello from Watson Conversation!'
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
        }
      }
    };

    nock(service.url)
      .post(path + '?version=' + service.version)
      .reply(200, expected);

    utils.postMessage(conversation, {
      workspace_id: workspace,
      input: {
        text: 'hi'
      }
    },
    function (err, response) {
      if (err) {
        return done(err);
      }
      assert.deepEqual(response, expected, 'Conversation response: ' + response + ' does not match expected response ' + expected);
      done();
    });
  });

  it('should continue a conversation', function (done) {
    var expected = {
      'intents': [],
      'entities': [],
      'input': {
        'text': 'What can you do?'
      },
      'output': {
        'log_messages': [],
        'text': [
          'I can tell you about myself. I have a charming personality!'
        ],
        'nodes_visited': [
          'node_3_1467221909631'
        ]
      },
      'context': {
        'conversation_id': '8a79f4db-382c-4d56-bb88-1b320edf9eae',
        'system': {
          'dialog_stack': [
            'root'
          ],
          'dialog_turn_counter': 2,
          'dialog_request_counter': 2
        }
      }
    };

    nock(service.url)
      .persist()
      .post(path + '?version=' + service.version)
      .reply(200, expected);

    utils.postMessage(conversation, {
      workspace_id: workspace,
      input: {
        text: 'What can you do?'
      },
      context: {
        'conversation_id': '8a79f4db-382c-4d56-bb88-1b320edf9eae',
        'system': {
          'dialog_stack': [
            'root'
          ],
          'dialog_turn_counter': 1,
          'dialog_request_counter': 1
        }
      }
    },
    function (err, response) {
      if (err) {
        return done(err);
      }
      assert.deepEqual(response, expected, 'Conversation response: ' + response + ' does not match expected response ' + expected);
      done();
    });
  });

});