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
import Botkit = require('botkit');
import AssistantV1 = require('ibm-watson/assistant/v1');
export interface MiddlewareConfig {
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
export interface Context {
    conversation_id: string;
    system: any;
    [index: string]: any;
}
export interface ContextDelta {
    [index: string]: any;
}
export declare type ErrorCallback = (err: null | Error) => null;
export declare class WatsonMiddleware {
    private config;
    private conversation;
    private storage;
    private minimumConfidence;
    private readonly ignoreType;
    constructor(config: MiddlewareConfig);
    hear(patterns: string[], message: Botkit.BotkitMessage): boolean;
    before(message: Botkit.BotkitMessage, payload: Payload, callback: (err: null | Error, payload: Payload) => null): void;
    after(message: Botkit.BotkitMessage, response: any, callback: (err: null | Error, response: any) => null): void;
    sendToWatsonAsync(bot: any, message: Botkit.BotkitMessage, contextDelta: ContextDelta): Promise<void>;
    receiveAsync(bot: Botkit.BotWorker, message: Botkit.BotkitMessage): Promise<void>;
    interpretAsync(bot: Botkit.BotWorker, message: Botkit.BotkitMessage): Promise<void>;
    readContextAsync(user: string): Promise<Context>;
    updateContextAsync(user: string, contextDelta: ContextDelta): Promise<{
        context: Context | ContextDelta;
    }>;
    receive(bot: Botkit.BotWorker, message: Botkit.BotkitMessage, callback: ErrorCallback): Promise<void>;
    interpret(bot: Botkit.BotWorker, message: Botkit.BotkitMessage, callback: ErrorCallback): Promise<void>;
    sendToWatson(bot: Botkit.BotWorker, message: Botkit.BotkitMessage, contextDelta: ContextDelta, callback: ErrorCallback): Promise<void>;
    readContext(user: string, callback: ErrorCallback): Promise<void>;
    updateContext(user: string, contextDelta: ContextDelta, callback: ErrorCallback): Promise<void>;
}
