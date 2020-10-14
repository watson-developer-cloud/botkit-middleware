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
import Botkit = require('botkit');
import AssistantV1 = require('ibm-watson/assistant/v1');
import { MessageParams, MessageResponse } from 'ibm-watson/assistant/v1';
import { Context } from 'ibm-watson/assistant/v1';
import { Storage } from 'botbuilder';
import { BotkitMessage } from 'botkit';
export interface WatsonMiddlewareConfig extends AssistantV1.Options {
    workspace_id: string;
    minimum_confidence?: number;
    storage?: Storage;
}
/**
 * @deprecated please use AssistantV1.MessageParams instead
 */
export declare type Payload = MessageParams;
export declare type BotkitWatsonMessage = BotkitMessage & {
    watsonData?: MessageResponse;
    watsonError?: string;
};
export interface ContextDelta {
    [index: string]: any;
}
export declare class WatsonMiddleware {
    private readonly config;
    private conversation;
    private storage;
    private readonly minimumConfidence;
    private readonly ignoreType;
    constructor(config: WatsonMiddlewareConfig);
    hear(patterns: string[], message: Botkit.BotkitMessage): boolean;
    before(message: Botkit.BotkitMessage, payload: MessageParams): Promise<MessageParams>;
    after(message: Botkit.BotkitMessage, response: MessageResponse): Promise<MessageResponse>;
    sendToWatson(bot: Botkit.BotWorker, message: Botkit.BotkitMessage, contextDelta: ContextDelta): Promise<void>;
    receive(bot: Botkit.BotWorker, message: Botkit.BotkitMessage): Promise<void>;
    interpret(bot: Botkit.BotWorker, message: Botkit.BotkitMessage): Promise<void>;
    readContext(user: string): Promise<Context>;
    updateContext(user: string, context: Context): Promise<{
        context: Context;
    }>;
    deleteUserData(customerId: string): Promise<void>;
}
