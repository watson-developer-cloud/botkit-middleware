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
const MemoryStorage = require('botbuilder').MemoryStorage;
const WebAdapter = require('botbuilder-adapter-web').WebAdapter;

describe('receive()', function () {

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

  it('should make first call to Assistant', function (done) {
    const expectedWatsonData = {
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
      .reply(200, expectedWatsonData);

    middleware.receive(bot, message, function (err) {
      if (err) {
        return done(err);
      }
      assert(message.watsonData, 'watsonData field missing in message!');
      assert.deepEqual(message.watsonData, expectedWatsonData, 'Received Watson Assistant data: ' + JSON.stringify(message.watsonData) + ' does not match the expected: ' + JSON.stringify(expectedWatsonData));
      done();
    });
  });

  it('should make second call to Assistant', function (done) {
    delete message.watsonData;
    message.text = 'What can you do?';

    const expectedWatsonData = {
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
      .post(path + '?version=' + service.version)
      .reply(200, expectedWatsonData);

    middleware.receive(bot, message, function (err) {
      if (err) {
        return done(err);
      }
      assert(message.watsonData, 'watsonData field missing in message!');
      assert.deepEqual(message.watsonData, expectedWatsonData, 'Received Watson Assistant data: ' + JSON.stringify(message.watsonData) + ' does not match the expected: ' + JSON.stringify(expectedWatsonData));
      done();
    });
  });

  it('should pass empty welcome message to Assistant', function (done) {
    const expectedWatsonData = {
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
      .reply(200, expectedWatsonData);

    const welcomeMessage = {
      'type': 'welcome',
      'channel': 'D2BQEJJ1X',
      'user': 'U2BLZSKFG',
      'text': '',
      'ts': '1475776074.000004',
      'team': 'T2BM5DPJ6'
    };

    middleware.receive(bot, welcomeMessage, function (err) {
      if (err) {
        return done(err);
      }
      assert(welcomeMessage.watsonData, 'watsonData field missing in message!');
      assert.deepEqual(welcomeMessage.watsonData, expectedWatsonData, 'Received Watson Assistant data: ' + JSON.stringify(welcomeMessage.watsonData) + ' does not match the expected: ' + JSON.stringify(expectedWatsonData));
      done();
    });
  });

  it('should replace not-permitted characters in message text', function (done) {
    delete message.watsonData;
    // text can not contain the following characters: tab, new line, carriage return.
    message.text = 'What\tcan\tyou\r\ndo?';
    const expectedMessage = 'What can you  do?';

    const expectedWatsonData = {
      'intents': [],
      'entities': [],
      'input': {
        'text': expectedMessage
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

    const watsonMock = nock(service.url)
      .post(path + '?version=' + service.version, function (body) {
        return body.input.text === expectedMessage;
      }).reply(200, expectedWatsonData);

    middleware.receive(bot, message, function (err) {
      if (err) {
        return done(err);
      }
      watsonMock.done();
      assert(message.watsonData, 'watsonData field missing in message!');
      assert.deepEqual(message.watsonData, expectedWatsonData, 'Received Watson Assistant data: ' + JSON.stringify(message.watsonData) + ' does not match the expected: ' + JSON.stringify(expectedWatsonData));
      done();
    });
  });
});
