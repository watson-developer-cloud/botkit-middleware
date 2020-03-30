"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botkit_1 = require("botkit");
const utils_1 = require("../lib/utils");
const clone_1 = require("clone");
const botbuilder_1 = require("botbuilder");
const botbuilder_adapter_web_1 = require("botbuilder-adapter-web");
const index_1 = require("../lib/index");
const nock = require("nock");
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
const message = {
    type: 'message',
    channel: 'D2BQEJJ1X',
    user: 'U2BLZSKFG',
    text: 'hi',
    ts: '1475776074.000004',
    team: 'T2BM5DPJ6',
    reference: null,
    incoming_message: null,
};
const adapter = new botbuilder_adapter_web_1.WebAdapter({ noServer: true });
const controller = new botkit_1.Botkit({
    adapter: adapter,
    storage: new botbuilder_1.MemoryStorage(),
    disable_webserver: true,
});
const middleware = new index_1.WatsonMiddleware(Object.assign(Object.assign({}, service), { workspace_id: workspaceId }));
let bot;
beforeEach(function (done) {
    nock.disableNetConnect();
    controller.spawn({}).then(botWorker => {
        bot = botWorker;
        done();
    });
});
afterEach(function () {
    nock.cleanAll();
});
test('should update context if contextDelta is provided', () => __awaiter(void 0, void 0, void 0, function* () {
    const storedContext = {
        a: 1,
        b: 'string',
        c: {
            d: 2,
            e: 3,
            f: {
                g: 4,
                h: 5,
            },
        },
    };
    const contextDelta = {
        b: null,
        j: 'new string',
        c: {
            f: {
                g: 5,
                i: 6,
            },
        },
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
                i: 6,
            },
        },
        j: 'new string',
    };
    const expectedContextInResponse = Object.assign(Object.assign({}, clone_1.clonePrototype(expectedContextInRequest)), { conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae', system: {
            dialog_stack: ['root'],
            dialog_turn_counter: 1,
            dialog_request_counter: 1,
        } });
    const messageToSend = Object.assign({}, message);
    const expectedRequest = {
        input: {
            text: messageToSend.text,
        },
        context: expectedContextInRequest,
    };
    const mockedWatsonResponse = {
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
        context: expectedContextInResponse,
    };
    //verify request and return mocked response
    nock(service.url)
        .post(pathWithQuery, expectedRequest)
        .reply(200, mockedWatsonResponse);
    yield utils_1.updateContext(messageToSend.user, controller.storage, {
        context: storedContext,
    });
    yield middleware.sendToWatson(bot, messageToSend, contextDelta);
    expect(messageToSend.watsonData.context).toEqual(expectedContextInResponse);
}));
test('should make request to different workspace, if workspace_id is set in context', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const newWorkspaceId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
        const expectedPath = `/v1/workspaces/${newWorkspaceId}/message`;
        const storedContext = {
            workspace_id: newWorkspaceId,
        };
        const messageToSend = Object.assign({}, message);
        const expectedContextInResponse = Object.assign(Object.assign({}, clone_1.clonePrototype(storedContext)), { conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae', system: {
                dialog_stack: ['root'],
                dialog_turn_counter: 1,
                dialog_request_counter: 1,
            } });
        const expectedRequest = {
            input: {
                text: messageToSend.text,
            },
            context: storedContext,
        };
        const mockedWatsonResponse = {
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
            context: expectedContextInResponse,
        };
        //verify request and return mocked response
        nock(service.url)
            .post(expectedPath + '?version=' + service.version, expectedRequest)
            .reply(200, mockedWatsonResponse);
        try {
            yield utils_1.updateContext(messageToSend.user, controller.storage, {
                context: storedContext,
            });
            yield middleware.sendToWatson(bot, messageToSend, {});
            expect(messageToSend.watsonError).toBeUndefined();
        }
        catch (err) {
            throw err;
        }
    });
});
//# sourceMappingURL=middleware-send-to-watson.test.js.map