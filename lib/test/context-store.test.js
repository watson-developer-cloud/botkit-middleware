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
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
const botkit_1 = require("botkit");
const botbuilder_1 = require("botbuilder");
const botbuilder_adapter_web_1 = require("botbuilder-adapter-web");
const sinon = require("sinon");
const message = {
    type: 'message',
    channel: 'D2BQEJJ1X',
    user: 'U2BLZSKFG',
    text: 'Hello there!',
    ts: '1475776074.000004',
    team: 'T2BM5DPJ6',
    incoming_message: null,
    reference: null,
};
const conversation_response = {
    intents: [],
    entities: [],
    input: {
        text: 'Hello there!',
    },
    output: {
        log_messages: [],
        text: [
            'Hi. It looks like a nice drive today. What would you like me to do? ',
        ],
        nodes_visited: ['node_1_1467221909631'],
    },
    context: {
        conversation_id: '8a79f4db-382c-4d56-bb88-1b320edf9eae',
        system: {
            dialog_stack: ['root'],
            dialog_turn_counter: 1,
            dialog_request_counter: 1,
        },
        default_counter: 0,
    },
};
const adapter = new botbuilder_adapter_web_1.WebAdapter({ noServer: true });
const controller = new botkit_1.Botkit({
    adapter: adapter,
    storage: new botbuilder_1.MemoryStorage(),
    disable_webserver: true,
});
const storage = controller.storage;
test('should read context correctly', function () {
    return utils_1.readContext(message.user, storage).then(function (context) {
        expect(context).toEqual(null);
    });
});
test('should suppress storage error', function () {
    const storageStub = sinon.stub(storage, 'read').rejects('error message');
    return utils_1.readContext(message.user, storage)
        .then(function () {
        storageStub.restore();
    })
        .catch(function (err) {
        storageStub.restore();
        throw err;
    });
});
test('should store context of the first response', function () {
    const itemId = 'user.' + message.user;
    return utils_1.updateContext(message.user, storage, conversation_response)
        .then(function () {
        return storage.read([itemId]);
    })
        .then(function (data) {
        expect(data[itemId].context).toEqual(conversation_response.context);
    });
});
test('should ignore storage error on read when user is not saved yet', function () {
    const storageStub1 = sinon
        .stub(storage, 'read')
        .rejects(new Error('error message'));
    const storageStub2 = sinon.stub(storage, 'write').resolves();
    const watsonResponse = {
        context: {
            a: 1,
        },
    };
    return utils_1.updateContext('NEWUSER3', storage, watsonResponse)
        .then(function (response) {
        expect(response).toEqual(watsonResponse);
        storageStub1.restore();
        storageStub2.restore();
    })
        .catch(function () {
        storageStub1.restore();
        storageStub2.restore();
    });
});
test('should return storage error on write', function () {
    const storageStub = sinon.stub(storage, 'write').rejects('error message');
    return utils_1.updateContext(message.user, storage, conversation_response)
        .then(function (err) {
        expect(err).toEqual('error message');
        storageStub.restore();
    })
        .catch(function () {
        storageStub.restore();
    });
});
test('should update existing context', function () {
    const firstContext = {
        a: 1,
        b: 2,
    };
    const secondContext = {
        c: 3,
        d: 4,
    };
    //first update
    return utils_1.updateContext(message.user, storage, {
        context: firstContext,
    })
        .then(function () {
        //second update
        return utils_1.updateContext(message.user, storage, {
            context: secondContext,
        });
    })
        .then(function () {
        return storage.read(['user.U2BLZSKFG']);
    })
        .then(function (data) {
        expect(data['user.U2BLZSKFG'].context).toEqual(secondContext);
    });
});
test('should preserve other data in storage', function () {
    const user = {
        id: 'U2BLZSKFX',
        profile: {
            age: 23,
            sex: 'male',
        },
    };
    const newContext = {
        a: 1,
        b: 2,
    };
    const itemId = 'user.' + user.id;
    const existingData = {};
    existingData[itemId] = user;
    return storage
        .write(existingData)
        .then(function () {
        return utils_1.updateContext(user.id, storage, {
            context: newContext,
        });
    })
        .then(function () {
        return storage.read([itemId]);
    })
        .then(function (data) {
        expect(data[itemId].profile).toEqual(user.profile);
        expect(data[itemId].context).toEqual(newContext);
    });
});
//# sourceMappingURL=context-store.test.js.map