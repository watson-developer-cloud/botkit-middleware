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
var utils = require('../lib/middleware/utils');
var clone = require('clone');

describe('sendToWatson()', function () {

  //Watson Conversation params
  var service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: '2018-07-10'
  };
  var workspace_id = 'zyxwv-54321';
  var path = '/v1/workspaces/' + workspace_id + '/message';

  // Botkit params
  var controller = Botkit.slackbot();
  var bot = controller.spawn({
    token: 'abc123'
  });
  var message = {
    'type': 'message',
    'channel': 'D2BQEJJ1X',
    'user': 'U2BLZSKFG',
    'text': 'hi',
    'ts': '1475776074.000004',
    'team': 'T2BM5DPJ6'
  };

  var config = service;
  config.workspace_id = workspace_id;
  var middleware = require('../lib/middleware/index')(config);

  before(function () {
    nock.disableNetConnect();
  });

  after(function () {
    nock.cleanAll();
  });

  it('should update context if contextDelta is provided', function (done) {
    var storedContext = {
      a: 1,
      b: 'string',
      c: {
        d: 2,
        e: 3,
        f: {
          g: 4,
          h: 5
        }
      }
    };

    var contextDelta = {
      b: null,
      j: 'new string',
      c: {
        f: {
          g: 5,
          i: 6
        }
      }
    };

    var expectedContextInRequest = {
      a: 1,
      b: null,
      c: {
        d: 2,
        e: 3,
        f: {
          g: 5,
          h: 5,
          i: 6
        }
      },
      j: 'new string'
    };

    var expectedContextInResponse = clone(expectedContextInRequest);
    expectedContextInResponse.conversation_id = '8a79f4db-382c-4d56-bb88-1b320edf9eae',
    expectedContextInResponse.system = {
      dialog_stack: [
        'root'
      ],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    var expectedRequest = {
      input: {
        text: message.text
      },
      context: expectedContextInRequest
    };

    var mockedWatsonResponse = {
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
      'context': expectedContextInResponse
    };

    //verify request and return mocked response
    nock(service.url)
      .post(path + '?version=' + service.version, expectedRequest)
      .reply(200, mockedWatsonResponse);

    utils.updateContext(message.user, bot.botkit.storage, {
      context: storedContext
    }, function (err) {
      assert.ifError(err);

      middleware.sendToWatson(bot, message, contextDelta, function (err) {
        assert.ifError(err);
        assert.ifError(message.watsonError);

        assert.deepEqual(message.watsonData.context, expectedContextInResponse);
        done();
      });
    });
  });

  it('should work if contextDelta parameter is missing for backwards compatibility', function (done) {
    var storedContext = {
      a: 1,
      b: 'string',
      c: {
        d: 2,
        e: 3,
        f: {
          g: 4,
          h: 5
        }
      }
    };

    var expectedContextInResponse = clone(storedContext);
    expectedContextInResponse.conversation_id = '8a79f4db-382c-4d56-bb88-1b320edf9eae',
    expectedContextInResponse.system = {
      dialog_stack: [
        'root'
      ],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    var expectedRequest = {
      input: {
        text: message.text
      },
      context: storedContext
    };

    var mockedWatsonResponse = {
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
      'context': expectedContextInResponse
    };

    //verify request and return mocked response
    nock(service.url)
      .post(path + '?version=' + service.version, expectedRequest)
      .reply(200, mockedWatsonResponse);

    utils.updateContext(message.user, bot.botkit.storage, {
      context: storedContext
    }, function (err) {
      assert.ifError(err);

      middleware.sendToWatson(bot, message, function (err) {
        assert.ifError(err);
        assert.ifError(message.watsonError);

        assert.deepEqual(message.watsonData.context, expectedContextInResponse);
        done();
      });
    });
  });

  it('should make request to different workspace, if workspace_id is set in context', function (done) {
    var newWorkspaceId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    var expectedPath = '/v1/workspaces/' + newWorkspaceId + '/message';

    var storedContext = {
      workspace_id: newWorkspaceId
    };

    var expectedContextInResponse = clone(storedContext);
    expectedContextInResponse.conversation_id = '8a79f4db-382c-4d56-bb88-1b320edf9eae',
    expectedContextInResponse.system = {
      dialog_stack: [
        'root'
      ],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    var expectedRequest = {
      input: {
        text: message.text
      },
      context: storedContext
    };

    var mockedWatsonResponse = {
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
      'context': expectedContextInResponse
    };

    //verify request and return mocked response
    var mockedRequest = nock(service.url)
      .post(expectedPath + '?version=' + service.version, expectedRequest)
      .reply(200, mockedWatsonResponse);

    utils.updateContext(message.user, bot.botkit.storage, {
      context: storedContext
    }, function (err) {
      assert.ifError(err);

      middleware.sendToWatson(bot, message, function (err) {
        assert.ifError(err);
        assert.ifError(message.watsonError);

        mockedRequest.done();
        done();
      });
    });
  });
});