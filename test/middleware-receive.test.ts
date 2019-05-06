/**
 * Copyright 2016-2019 IBM Corp. All Rights Reserved.
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

import { Botkit, BotkitMessage } from 'botkit';
import { MemoryStorage } from 'botbuilder';
import { WebAdapter } from 'botbuilder-adapter-web';
import { WatsonMiddleware, BotkitWatsonMessage } from '../lib/index';
import nock = require('nock');

//Watson Assistant params
const service = {
  username: 'batman',
  password: 'bruce-wayne',
  url: 'http://ibm.com:80',
  version: '2018-07-10',
};
const workspaceId = 'zyxwv-54321';
const path = `/v1/workspaces/${workspaceId}/message`;
const pathWithQuery = `${path}?version=${service.version}`;
const message: BotkitMessage = {
  type: 'message',
  channel: 'D2BQEJJ1X',
  user: 'U2BLZSKFG',
  text: 'hi',
  ts: '1475776074.000004',
  team: 'T2BM5DPJ6',
  reference: null,
  incoming_message: null,
};

const adapter = new WebAdapter({ noServer: true });
const controller = new Botkit({
  adapter: adapter,
  storage: new MemoryStorage(), //specifying storage explicitly eliminates 3 lines of warning output
  disable_webserver: true,
});

const middleware = new WatsonMiddleware({
  ...service,
  workspace_id: workspaceId,
});
let bot = null;

beforeEach(function(done) {
  nock.disableNetConnect();
  controller.spawn({}).then(botWorker => {
    bot = botWorker;
    done();
  });
});

afterEach(function() {
  nock.cleanAll();
});

test('should make first call to Assistant', async () => {
  const expectedWatsonData = {
    intents: [],
    entities: [],
    input: {
      text: 'hi',
    },
    output: {
      log_messages: [],
      text: ['Hello from Watson Assistant!'],
      nodes_visited: ['node_1_1467221909631'],
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 1,
        dialog_request_counter: 1,
      },
    },
  };
  nock(service.url)
    .post(pathWithQuery)
    .reply(200, expectedWatsonData);

  const receivedMessage: BotkitWatsonMessage = { ...message };
  await middleware.receive(bot, receivedMessage);
  expect(receivedMessage.watsonData).toEqual(expectedWatsonData);
});

test('should make second call to Assistant', async () => {
  const receivedMessage: BotkitWatsonMessage = {
    ...message,
    text: 'What can you do?',
  };

  const expectedWatsonData = {
    intents: [],
    entities: [],
    input: {
      text: 'What can you do?',
    },
    output: {
      log_messages: [],
      text: ['I can tell you about myself. I have a charming personality!'],
      nodes_visited: ['node_3_1467221909631'],
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 2,
        dialog_request_counter: 2,
      },
    },
  };

  nock(service.url)
    .post(pathWithQuery)
    .reply(200, expectedWatsonData);

  await middleware.receive(bot, receivedMessage);
  expect(receivedMessage.watsonData).toEqual(expectedWatsonData);
});

test('should pass empty welcome message to Assistant', async () => {
  const expectedWatsonData = {
    intents: [],
    entities: [],
    input: {
      text: 'hi',
    },
    output: {
      log_messages: [],
      text: ['Hello from Watson Assistant!'],
      nodes_visited: ['node_1_1467221909631'],
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 1,
        dialog_request_counter: 1,
      },
    },
  };
  nock(service.url)
    .post(pathWithQuery)
    .reply(200, expectedWatsonData);

  const welcomeMessage: BotkitWatsonMessage = { ...message, type: 'welcome' };

  await middleware.receive(bot, welcomeMessage);
  expect(welcomeMessage.watsonData).toEqual(expectedWatsonData);
});

test('should replace not-permitted characters in message text', async () => {
  // text can not contain the following characters: tab, new line, carriage return.
  const receivedMessage: BotkitWatsonMessage = {
    ...message,
    text: 'What\tcan\tyou\r\ndo?',
  };
  const expectedMessage = 'What can you  do?';

  const expectedWatsonData = {
    intents: [],
    entities: [],
    input: {
      text: expectedMessage,
    },
    output: {
      log_messages: [],
      text: ['I can tell you about myself. I have a charming personality!'],
      nodes_visited: ['node_3_1467221909631'],
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 2,
        dialog_request_counter: 2,
      },
    },
  };

  nock(service.url)
    .post(pathWithQuery, ({ input }) => input.text === expectedMessage)
    .reply(200, expectedWatsonData);

  await middleware.receive(bot, receivedMessage);
  expect(receivedMessage.watsonData).toEqual(expectedWatsonData);
});
