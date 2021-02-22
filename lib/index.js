"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatsonMiddleware = void 0;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('watson-middleware:index');
const AssistantV1 = require("ibm-watson/assistant/v1");
const auth_1 = require("ibm-watson/auth");
const utils_1 = require("./utils");
const deepMerge = require("deepmerge");
class WatsonMiddleware {
    constructor(_a) {
        var { iam_apikey, minimum_confidence, storage } = _a, config = __rest(_a, ["iam_apikey", "minimum_confidence", "storage"]);
        this.minimumConfidence = 0.75;
        // These are initiated by Slack itself and not from the end-user. Won't send these to WCS.
        this.ignoreType = ['presence_change', 'reconnect_url'];
        if (minimum_confidence) {
            this.minimumConfidence = minimum_confidence;
        }
        if (storage) {
            this.storage = storage;
        }
        if (iam_apikey) {
            config.authenticator = new auth_1.IamAuthenticator({
                apikey: iam_apikey,
            });
        }
        this.config = config;
        debug('Creating Assistant object with parameters: ' +
            JSON.stringify(this.config, null, 2));
        this.conversation = new AssistantV1(this.config);
    }
    hear(patterns, message) {
        if (message.watsonData && message.watsonData.intents) {
            for (let p = 0; p < patterns.length; p++) {
                for (let i = 0; i < message.watsonData.intents.length; i++) {
                    if (message.watsonData.intents[i].intent === patterns[p] &&
                        message.watsonData.intents[i].confidence >= this.minimumConfidence) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    before(message, payload) {
        return Promise.resolve(payload);
    }
    after(message, response) {
        return Promise.resolve(response);
    }
    sendToWatson(bot, message, contextDelta) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((!message.text && message.type !== 'welcome') ||
                this.ignoreType.indexOf(message.type) !== -1 ||
                message.reply_to ||
                message.bot_id) {
                // Ignore messages initiated by Slack. Reply with dummy output object
                message.watsonData = {
                    output: {
                        text: [],
                    },
                };
                return;
            }
            this.storage = bot.controller.storage;
            try {
                const userContext = yield utils_1.readContext(message.user, this.storage);
                const payload = {
                    workspaceId: this.config.workspace_id,
                };
                if (message.text) {
                    // text can not contain the following characters: tab, new line, carriage return.
                    const sanitizedText = message.text.replace(/[\r\n\t]/g, ' ');
                    payload.input = {
                        text: sanitizedText,
                    };
                }
                if (userContext) {
                    payload.context = userContext;
                }
                if (contextDelta) {
                    if (!userContext) {
                        //nothing to merge, this is the first context
                        payload.context = contextDelta;
                    }
                    else {
                        payload.context = deepMerge(payload.context, contextDelta);
                    }
                }
                if (payload.context &&
                    payload.context.workspace_id &&
                    payload.context.workspace_id.length === 36) {
                    payload.workspaceId = payload.context.workspace_id;
                }
                const watsonRequest = yield this.before(message, payload);
                let watsonResponse = yield utils_1.postMessage(this.conversation, watsonRequest);
                if (typeof watsonResponse.output.error === 'string') {
                    debug('Error: %s', watsonResponse.output.error);
                    message.watsonError = watsonResponse.output.error;
                }
                watsonResponse = yield this.after(message, watsonResponse);
                message.watsonData = watsonResponse;
                yield utils_1.updateContext(message.user, this.storage, watsonResponse);
            }
            catch (error) {
                message.watsonError = error;
                debug('Error: %s', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            }
        });
    }
    receive(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendToWatson(bot, message, null);
        });
    }
    interpret(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendToWatson(bot, message, null);
        });
    }
    readContext(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage) {
                throw new Error('readContext is called before the first this.receive call');
            }
            return utils_1.readContext(user, this.storage);
        });
    }
    updateContext(user, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage) {
                throw new Error('updateContext is called before the first this.receive call');
            }
            return utils_1.updateContext(user, this.storage, {
                context: context,
            });
        });
    }
    deleteUserData(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                customerId: customerId,
                return_response: true,
            };
            try {
                const response = yield this.conversation.deleteUserData(params);
                debug('deleteUserData response', response);
            }
            catch (err) {
                throw new Error('Failed to delete user data, response code: ' +
                    err.code +
                    ', message: ' +
                    err.message);
            }
        });
    }
}
exports.WatsonMiddleware = WatsonMiddleware;
//# sourceMappingURL=index.js.map