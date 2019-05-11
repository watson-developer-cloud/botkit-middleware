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
import { Context } from 'ibm-watson/assistant/v1';
import { BotkitMessage } from 'botkit';
export interface WatsonMiddlewareConfig {
    version: string;
    workspace_id: string;
    url?: string;
    token?: string;
    headers?: {
        [index: string]: string;
    };
    use_unauthenticated?: boolean;
    username?: string;
    password?: string;
    iam_apikey?: string;
    iam_url?: string;
    minimum_confidence?: number;
}
export interface Payload extends AssistantV1.MessageRequest {
    workspace_id: string;
}
export declare type BotkitWatsonMessage = BotkitMessage & {
    watsonData?: Payload;
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
    before(message: Botkit.BotkitMessage, payload: Payload): Promise<Payload>;
    after(message: Botkit.BotkitMessage, response: any): Promise<any>;
    sendToWatson(bot: Botkit.BotWorker, message: Botkit.BotkitMessage, contextDelta: ContextDelta): Promise<void>;
    receive(bot: Botkit.BotWorker, message: Botkit.BotkitMessage): Promise<void>;
    interpret(bot: Botkit.BotWorker, message: Botkit.BotkitMessage): Promise<void>;
    readContext(user: string): Promise<Context>;
    updateContext(user: string, context: Context): Promise<{
        context: Context;
    }>;
}
