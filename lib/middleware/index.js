"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require('debug')('watson-middleware:index');
const AssistantV1 = require("ibm-watson/assistant/v1");
const utils_1 = require("./utils");
const deepMerge = require("deepmerge");
const util_1 = require("util");
class WatsonMiddleware {
    constructor(config) {
        this.minimumConfidence = 0.75;
        // These are initiated by Slack itself and not from the end-user. Won't send these to WCS.
        this.ignoreType = ['presence_change', 'reconnect_url'];
        this.config = config;
        if (config.minimum_confidence) {
            this.minimumConfidence = config.minimum_confidence;
        }
    }
    hear(patterns, message) {
        if (message.watsonData && message.watsonData.intents) {
            for (var p = 0; p < patterns.length; p++) {
                for (var i = 0; i < message.watsonData.intents.length; i++) {
                    if (message.watsonData.intents[i].intent === patterns[p] &&
                        message.watsonData.intents[i].confidence >= this.minimumConfidence) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    before(message, payload, callback) {
        callback(null, payload);
    }
    after(message, response, callback) {
        callback(null, response);
    }
    sendToWatsonAsync(bot, message, contextDelta) {
        return __awaiter(this, void 0, void 0, function* () {
            var before = util_1.promisify(this.before);
            var after = util_1.promisify(this.after);
            if (!this.conversation) {
                debug('Creating Assistant object with parameters: ' + JSON.stringify(this.config, null, 2));
                this.conversation = new AssistantV1(this.config);
            }
            if ((!message.text && message.type !== 'welcome') || this.ignoreType.indexOf(message.type) !== -1 || message.reply_to || message.bot_id) {
                // Ignore messages initiated by Slack. Reply with dummy output object
                message.watsonData = {
                    output: {
                        text: []
                    }
                };
                return;
            }
            this.storage = bot.controller.storage;
            try {
                const userContext = yield utils_1.readContext(message.user, this.storage);
                var payload = {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    workspace_id: this.config.workspace_id
                };
                if (message.text) {
                    // text can not contain the following characters: tab, new line, carriage return.
                    var sanitizedText = message.text.replace(/[\r\n\t]/g, ' ');
                    payload.input = {
                        text: sanitizedText
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
                if (payload.context && payload.context.workspace_id && payload.context.workspace_id.length === 36) {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    payload.workspace_id = payload.context.workspace_id;
                }
                const watsonRequest = yield before(message, payload);
                let watsonResponse = yield utils_1.postMessage(this.conversation, watsonRequest);
                watsonResponse = yield after(message, watsonResponse);
                message.watsonData = watsonResponse;
                yield utils_1.updateContext(message.user, this.storage, watsonResponse);
            }
            catch (error) {
                message.watsonError = error;
                debug('Error: %s', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            }
        });
    }
    receiveAsync(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendToWatsonAsync(bot, message, null);
        });
    }
    ;
    interpretAsync(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendToWatsonAsync(bot, message, null);
        });
    }
    ;
    readContextAsync(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage) {
                throw new Error('readContext is called before the first this.receive call');
            }
            return utils_1.readContext(user, this.storage);
        });
    }
    ;
    updateContextAsync(user, contextDelta) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage) {
                throw new Error('updateContext is called before the first this.receive call');
            }
            return utils_1.updateContext(user, this.storage, {
                context: contextDelta
            });
        });
    }
    ;
    receive(bot, message, callback) {
        return utils_1.asCallback(this.receiveAsync(bot, message), callback);
    }
    interpret(bot, message, callback) {
        return utils_1.asCallback(this.interpretAsync(bot, message), callback);
    }
    sendToWatson(bot, message, contextDelta, callback) {
        return utils_1.asCallback(this.sendToWatsonAsync(bot, message, contextDelta), callback);
    }
    readContext(user, callback) {
        return utils_1.asCallback(this.readContextAsync(user), callback);
    }
    ;
    updateContext(user, contextDelta, callback) {
        return utils_1.asCallback(this.updateContextAsync(user, contextDelta), callback);
    }
    ;
}
exports.WatsonMiddleware = WatsonMiddleware;
//# sourceMappingURL=index.js.map