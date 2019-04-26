import * as Botkit from 'botkit';
import Bluebird = require('bluebird');
import { Storage } from 'botbuilder-core';


declare namespace WatsonMiddleware {
  interface Data {
    output: OutputData;
    input?: MessageInput;
    intents?: RuntimeIntent[];
    entities?: RuntimeEntity[];
    alternate_intents?: boolean;
    context?: Context;
  }

  interface MessageInput {
    text: string;
  }

  interface RuntimeIntent {
    intent: string;
    confidence: number;
  }

  interface RuntimeEntity {
    entity: string;
    location: number[];
    value: string;
    confidence: number;
    metadata?: {
      [index: string]: any;
    };
  }

  interface Context {
    conversation_id: string;
    system: any;
    [index: string]: any;
  }

  interface OutputData {
    text: string[];
    log_messages?: LogMessage[];
    nodes_visited?: string[];
    [index: string]: any;
  }

  interface LogMessage {
    level: string;
    msg: string;
  }

  interface MiddlewareConfig {
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

  interface Middleware {
    minimum_confidence: number;
    conversation: any;
    storage: Storage;
    hear: (patterns: string[], message: Botkit.BotkitMessage) => boolean;
    before: (
      message: Botkit.BotkitMessage,
      payload: Payload,
      callback: (err: string | Error, payload: Payload) => void
    ) => void;
    after: (message: Botkit.BotkitMessage, response, callback) => void;
    sendToWatson: (
      bot: Botkit.BotWorker,
      message: Botkit.BotkitMessage,
      contextDelta: ContextDelta,
      next: () => void
    ) => void;
    receive: (
      bot: Botkit.BotWorker,
      message: Botkit.BotkitMessage,
      next: () => void
    ) => void;
    interpret: (
      bot: Botkit.BotWorker,
      message: Botkit.BotkitMessage,
      next: () => void
    ) => void;
    readContext: (
      user: string,
      callback: (err: string | Error | null, context?: Context) => void
    ) => void;
    updateContext: (
      user: string,
      context: Context,
      callback: (err: string | Error | null, watsonResponse?: Data) => void
    ) => void;
    sendToWatsonAsync: (
      bot: Botkit.BotWorker,
      message: Botkit.BotkitMessage,
      contextDelta: ContextDelta
    ) => Bluebird<void>;
    interpretAsync: (
      bot: Botkit.BotWorker,
      message: Botkit.BotkitMessage
    ) => Bluebird<void>;
    readContextAsync: (user: string) => Bluebird<Context>;
    updateContextAsync: (user: string, context: Context) => Bluebird<Data>;
  }

  interface Payload {
    workspace_id: string;
    input: {
      text: string;
    };
    context?: Context;
  }

  interface ContextDelta {
    [index: string]: any;
  }

  export function factory(config: MiddlewareConfig): Middleware;
}

export = WatsonMiddleware.factory;
