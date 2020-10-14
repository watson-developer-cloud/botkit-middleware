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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('watson-middleware:index');
import Botkit = require('botkit');
import AssistantV1 = require('ibm-watson/assistant/v1');
import { MessageParams, MessageResponse } from 'ibm-watson/assistant/v1';
import { Context } from 'ibm-watson/assistant/v1';
import { Storage } from 'botbuilder';
import { readContext, updateContext, postMessage } from './utils';
import deepMerge = require('deepmerge');
import { BotkitMessage } from 'botkit';

export interface WatsonMiddlewareConfig extends AssistantV1.Options {
  workspace_id: string;
  minimum_confidence?: number;
  storage?: Storage;
}

/**
 * @deprecated please use AssistantV1.MessageParams instead
 */
export type Payload = MessageParams;

export type BotkitWatsonMessage = BotkitMessage & {
  watsonData?: MessageResponse;
  watsonError?: string;
};

export interface ContextDelta {
  [index: string]: any;
}

export class WatsonMiddleware {
  private readonly config: WatsonMiddlewareConfig;
  private conversation: AssistantV1;
  private storage: Storage;
  private readonly minimumConfidence: number = 0.75;
  // These are initiated by Slack itself and not from the end-user. Won't send these to WCS.
  private readonly ignoreType = ['presence_change', 'reconnect_url'];

  public constructor(config: WatsonMiddlewareConfig) {
    this.config = config;
    if (config.minimum_confidence) {
      this.minimumConfidence = config.minimum_confidence;
    }
    if(config.storage){
      this.storage = config.storage;
    }

    debug(
      'Creating Assistant object with parameters: ' +
        JSON.stringify(this.config, null, 2),
    );
    this.conversation = new AssistantV1(this.config);
  }

  public hear(patterns: string[], message: Botkit.BotkitMessage): boolean {
    if (message.watsonData && message.watsonData.intents) {
      for (let p = 0; p < patterns.length; p++) {
        for (let i = 0; i < message.watsonData.intents.length; i++) {
          if (
            message.watsonData.intents[i].intent === patterns[p] &&
            message.watsonData.intents[i].confidence >= this.minimumConfidence
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public before(
    message: Botkit.BotkitMessage,
    payload: MessageParams,
  ): Promise<MessageParams> {
    return Promise.resolve(payload);
  }

  public after(
    message: Botkit.BotkitMessage,
    response: MessageResponse,
  ): Promise<MessageResponse> {
    return Promise.resolve(response);
  }

  public async sendToWatson(
    bot: Botkit.BotWorker,
    message: Botkit.BotkitMessage,
    contextDelta: ContextDelta,
  ): Promise<void> {
    if (
      (!message.text && message.type !== 'welcome') ||
      this.ignoreType.indexOf(message.type) !== -1 ||
      message.reply_to ||
      message.bot_id
    ) {
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
      const userContext = await readContext(message.user, this.storage);

      const payload: MessageParams = {
        // eslint-disable-next-line @typescript-eslint/camelcase
        workspace_id: this.config.workspace_id,
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
        } else {
          payload.context = deepMerge(payload.context, contextDelta);
        }
      }
      if (
        payload.context &&
        payload.context.workspace_id &&
        payload.context.workspace_id.length === 36
      ) {
        // eslint-disable-next-line @typescript-eslint/camelcase
        payload.workspace_id = payload.context.workspace_id;
      }

      const watsonRequest = await this.before(message, payload);
      let watsonResponse = await postMessage(this.conversation, watsonRequest);
      if (typeof watsonResponse.output.error === 'string') {
        debug('Error: %s', watsonResponse.output.error);
        message.watsonError = watsonResponse.output.error;
      }
      watsonResponse = await this.after(message, watsonResponse);

      message.watsonData = watsonResponse;
      await updateContext(message.user, this.storage, watsonResponse);
    } catch (error) {
      message.watsonError = error;
      debug(
        'Error: %s',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
    }
  }

  public async receive(
    bot: Botkit.BotWorker,
    message: Botkit.BotkitMessage,
  ): Promise<void> {
    return this.sendToWatson(bot, message, null);
  }

  public async interpret(
    bot: Botkit.BotWorker,
    message: Botkit.BotkitMessage,
  ): Promise<void> {
    return this.sendToWatson(bot, message, null);
  }

  public async readContext(user: string): Promise<Context> {
    if (!this.storage) {
      throw new Error(
        'readContext is called before the first this.receive call',
      );
    }
    return readContext(user, this.storage);
  }

  public async updateContext(
    user: string,
    context: Context,
  ): Promise<{ context: Context }> {
    if (!this.storage) {
      throw new Error(
        'updateContext is called before the first this.receive call',
      );
    }
    return updateContext(user, this.storage, {
      context: context,
    });
  }

  public async deleteUserData(customerId: string) {
    const params = {
      customer_id: customerId,
      return_response: true,
    };
    try {
      const response = await this.conversation.deleteUserData(params);
      debug('deleteUserData response', response);
    } catch (err) {
      throw new Error(
        'Failed to delete user data, response code: ' +
          err.code +
          ', message: ' +
          err.message,
      );
    }
  }
}
