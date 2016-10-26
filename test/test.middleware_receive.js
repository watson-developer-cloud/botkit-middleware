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
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var nock = require('nock');

describe('conversation_turns()', function() {

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

  before(function() {
    nock.disableNetConnect();
  });

  after(function() {
    nock.cleanAll();
  });

  it('should make first call to Conversation', function(done) {
    var expected = {
      "intents": [],
      "entities": [],
      "input": {
        "text": "hi"
      },
      "output": {
        "log_messages": [],
        "text": [
          "Hello from Watson Conversation!"
        ],
        "nodes_visited": [
          "node_1_1467221909631"
        ]
      },
      "context": {
        "conversation_id": "8a79f4db-382c-4d56-bb88-1b320edf9eae",
        "system": {
          "dialog_stack": [
            "root"
          ],
          "dialog_turn_counter": 1,
          "dialog_request_counter": 1
        }
      }
    };
    nock(service.url)
      .post(path + '?version=' + service.version_date)
      .reply(200, expected)

    middleware.receive(bot, message, function(err, response) {
      if (err) {
        return done(err);
      }
      assert(message.watsonData, 'watsonData field missing in message!');
      assert.deepEqual(message.watsonData, expected, 'Received Watson Conversation data: ' + message.watsonData + ' does not match the expected: ' + expected);
      done();
    });
  });

  it('should make second call to Conversation', function(done) {
    delete message.watsonData;
    message.text = 'What can you do?';

    var expected = {
      "intents": [],
      "entities": [],
      "input": {
        "text": "What can you do?"
      },
      "output": {
        "log_messages": [],
        "text": [
          "I can tell you about myself. I have a charming personality!"
        ],
        "nodes_visited": [
          "node_3_1467221909631"
        ]
      },
      "context": {
        "conversation_id": "8a79f4db-382c-4d56-bb88-1b320edf9eae",
        "system": {
          "dialog_stack": [
            "root"
          ],
          "dialog_turn_counter": 2,
          "dialog_request_counter": 2
        }
      }
    };

    nock(service.url)
      .post(path + '?version=' + service.version_date)
      .reply(200, expected);

    middleware.receive(bot, message, function(err, response) {
      if (err) {
        return done(err);
      }
      assert(message.watsonData, 'watsonData field missing in message!');
      assert.deepEqual(message.watsonData, expected, 'Received Watson Conversation data: ' + message.watsonData + ' does not match the expected: ' + expected);
      done();
    });
  });

});
