var assert = require('assert');
var utils = require('../../lib/middleware/utils');
var nock = require('nock');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');

describe('conversation()', function() {

  //Watson Conversation params
  var service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: 'v1',
    version_date: '2016-07-11'
  };
  var workspace = 'zyxwv-54321';
  var path = '/v1/workspaces/' + workspace + '/message';
  var conversation = new ConversationV1(service);

  before(function() {
    nock.disableNetConnect();
  });

  after(function() {
    nock.cleanAll();
  });

  it('should initiate a conversation', function(done) {
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
      .reply(200, expected);

    utils.postMessage(conversation, {
        workspace_id: workspace,
        input: {
          text: 'hi'
        }
      },
      function(err, response) {
        if (err) {
          return done(err);
        }
        assert.deepEqual(response, expected, 'Conversation response: ' + response + ' does not match expected response ' + expected);
        done();
      });
  });

  it('should continue a conversation', function(done) {
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
      .persist()
      .post(path + '?version=' + service.version_date)
      .reply(200, expected);

    utils.postMessage(conversation, {
        workspace_id: workspace,
        input: {
          text: 'What can you do?'
        },
        context: {
          "conversation_id": "8a79f4db-382c-4d56-bb88-1b320edf9eae",
          "system": {
            "dialog_stack": [
              "root"
            ],
            "dialog_turn_counter": 1,
            "dialog_request_counter": 1
          }
        }
      },
      function(err, response) {
        if (err) {
          return done(err);
        }
        assert.deepEqual(response, expected, 'Conversation response: ' + response + ' does not match expected response ' + expected);
        done();
      });
  });

});;
