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
var Botkit = require('botkit');

describe('context()', function() {
  var message = {
    "type": "message",
    "channel": "D2BQEJJ1X",
    "user": "U2BLZSKFG",
    "text": "Hello there!",
    "ts": "1475776074.000004",
    "team": "T2BM5DPJ6"
  };

  var payload = {
    workspace_id: "zyxwv-54321",
    input: {
      text: "Hi there!"
    }
  };

  var conversation_response = {
    "intents": [],
    "entities": [],
    "input": {
      "text": "Hello there!"
    },
    "output": {
      "log_messages": [],
      "text": [
        "Hi. It looks like a nice drive today. What would you like me to do? "
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
      },
      "default_counter": 0
    }
  };

  var controller = Botkit.slackbot();
  var bot = controller.spawn({
    token: "abc123"
  });
  var storage = bot.botkit.storage;

  it('should read context correctly', function() {
    utils.readContext(message, storage, function(cb, context) {
      assert.deepEqual(context, null, 'Actual context: ' + context + '\ndoes not match expected context: ' + null);
    });
  });

  it('should update context correctly', function() {
    var expected_store = {
      "U2BLZSKFG": {
        "id": "U2BLZSKFG",
        "context": conversation_response.context
      }
    };
    utils.updateContext(message.user, storage, conversation_response, function(cb, response) {
      storage.users.all(function(err, data) {
        assert.equal(err, null);
        assert.deepEqual(data, expected_store, 'Updated store: ' + data + '\ndoes not match expected store: ' + expected_store);
      });
    });
  });

});;
