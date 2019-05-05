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

import utils = require('../lib/utils');
import nock = require('nock');
import AssistantV1 = require('ibm-watson/assistant/v1');

//Watson Assistant params
const service = {
  username: 'batman',
  password: 'bruce-wayne',
  url: 'http://ibm.com:80',
  version: '2018-07-10'
};
const workspaceId = 'zyxwv-54321';
const path = `/v1/workspaces/${workspaceId}/message`;
const pathWithQuery = `${path}?version=${service.version}`;
const conversation = new AssistantV1(service);

beforeEach(function() {
  nock.disableNetConnect();
});

afterEach(function() {
  nock.cleanAll();
});

it('should initiate a conversation', function() {
  const expected = {
    intents: [],
    entities: [],
    input: {
      text: 'hi'
    },
    output: {
      log_messages: [],
      text: ['Hello from Watson Assistant!'],
      nodes_visited: ['node_1_1467221909631']
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 1,
        dialog_request_counter: 1
      }
    }
  };

  nock(service.url)
    .post(pathWithQuery)
    .reply(200, expected);

  return utils
    .postMessage(conversation, {
      workspace_id: workspaceId,
      input: {
        text: 'hi'
      }
    })
    .then(function(response) {
      expect(response).toEqual(expected);
    });
});

it('should continue a conversation', async () => {
  const expected = {
    intents: [],
    entities: [],
    input: {
      text: 'What can you do?'
    },
    output: {
      log_messages: [],
      text: ['I can tell you about myself. I have a charming personality!'],
      nodes_visited: ['node_3_1467221909631']
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 2,
        dialog_request_counter: 2
      }
    }
  };

  nock(service.url)
    .post(pathWithQuery)
    .reply(200, expected);

  const response = await utils.postMessage(conversation, {
    workspace_id: workspaceId,
    input: {
      text: 'What can you do?'
    },
    context: {
      conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
      system: {
        dialog_stack: ['root'],
        dialog_turn_counter: 1,
        dialog_request_counter: 1
      }
    }
  });
  expect(response).toEqual(expected);
});
