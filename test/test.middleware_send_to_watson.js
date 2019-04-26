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
const Botkit = require('botkit');
const nock = require('nock');
const utils = require('../lib/middleware/utils');
const clone = require('clone');
const MemoryStorage = require('botbuilder').MemoryStorage;
const WebAdapter = require('botbuilder-adapter-web').WebAdapter;

describe('sendToWatson()', function () {

  //Watson Assistant params
  const service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: '2018-07-10'
  };
  const workspace_id = 'zyxwv-54321';
  const path = '/v1/workspaces/' + workspace_id + '/message';

  const adapter = new WebAdapter({});
  const controller = new Botkit.Botkit({
    adapter: adapter,
    storage: new MemoryStorage(), //specifying storage explicitly eliminates 3 lines of warning output
    authFunction: function() {} //eliminates 1 line of warning output
  });

  var bot;

  const message = {
    'type': 'message',
    'channel': 'D2BQEJJ1X',
    'user': 'U2BLZSKFG',
    'text': 'hi',
    'ts': '1475776074.000004',
    'team': 'T2BM5DPJ6'
  };

  const config = service;
  config.workspace_id = workspace_id;
  const middleware = require('../lib/middleware/index')(config);

  before(function () {
    nock.disableNetConnect();
    return controller.spawn().then((botWorker) => {
      bot = botWorker;
    });
  });

  after(function () {
    nock.cleanAll();
  });

  it('should update context if contextDelta is provided', function (done) {
    const storedContext = {
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

    const contextDelta = {
      b: null,
      j: 'new string',
      c: {
        f: {
          g: 5,
          i: 6
        }
      }
    };

    const expectedContextInRequest = {
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

    const expectedContextInResponse = clone(expectedContextInRequest);
    expectedContextInResponse.conversation_id = '8a79f4db-382c-4d56-bb88-1b320edf9eae';
    expectedContextInResponse.system = {
      dialog_stack: [
        'root'
      ],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    const expectedRequest = {
      input: {
        text: message.text
      },
      context: expectedContextInRequest
    };

    const mockedWatsonResponse = {
      'intents': [],
      'entities': [],
      'input': {
        'text': 'hi'
      },
      'output': {
        'log_messages': [],
        'text': [
          'Hello from Watson Assistant!'
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

    utils.updateContext(message.user, controller.storage, {
      context: storedContext
    }).then(function () {
      middleware.sendToWatson(bot, message, contextDelta, function (err) {
        assert.ifError(err);
        assert.ifError(message.watsonError);

        assert.deepEqual(message.watsonData.context, expectedContextInResponse);
        done();
      });
    }).catch(function(err) {
      done(err);
    });
  });

  it('should work if contextDelta parameter is missing for backwards compatibility', function (done) {
    const storedContext = {
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

    const expectedContextInResponse = clone(storedContext);
    expectedContextInResponse.conversation_id = '8a79f4db-382c-4d56-bb88-1b320edf9eae';
    expectedContextInResponse.system = {
      dialog_stack: [
        'root'
      ],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    const expectedRequest = {
      input: {
        text: message.text
      },
      context: storedContext
    };

    const mockedWatsonResponse = {
      'intents': [],
      'entities': [],
      'input': {
        'text': 'hi'
      },
      'output': {
        'log_messages': [],
        'text': [
          'Hello from Watson Assistant!'
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

    utils.updateContext(message.user, controller.storage, {
      context: storedContext
    }).then(function() {
      middleware.sendToWatson(bot, message, function (err) {
        assert.ifError(err);
        assert.ifError(message.watsonError);

        assert.deepEqual(message.watsonData.context, expectedContextInResponse);
        done();
      });
    }).catch(function(err) {
      done(err);
    });
  });

  it('should make request to different workspace, if workspace_id is set in context', function (done) {
    const newWorkspaceId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const expectedPath = '/v1/workspaces/' + newWorkspaceId + '/message';

    const storedContext = {
      workspace_id: newWorkspaceId
    };

    const expectedContextInResponse = clone(storedContext);
    expectedContextInResponse.conversation_id = '8a79f4db-382c-4d56-bb88-1b320edf9eae';
    expectedContextInResponse.system = {
      dialog_stack: [
        'root'
      ],
      dialog_turn_counter: 1,
      dialog_request_counter: 1
    };

    const expectedRequest = {
      input: {
        text: message.text
      },
      context: storedContext
    };

    const mockedWatsonResponse = {
      'intents': [],
      'entities': [],
      'input': {
        'text': 'hi'
      },
      'output': {
        'log_messages': [],
        'text': [
          'Hello from Watson Assistant!'
        ],
        'nodes_visited': [
          'node_1_1467221909631'
        ]
      },
      'context': expectedContextInResponse
    };

    //verify request and return mocked response
    const mockedRequest = nock(service.url)
      .post(expectedPath + '?version=' + service.version, expectedRequest)
      .reply(200, mockedWatsonResponse);

    utils.updateContext(message.user, controller.storage, {
      context: storedContext
    }).then(function () {

      middleware.sendToWatson(bot, message, function (err) {
        assert.ifError(err);
        assert.ifError(message.watsonError);

        mockedRequest.done();
        done();
      });
    }).catch(function(err) {
      done(err);
    });
  });
});
