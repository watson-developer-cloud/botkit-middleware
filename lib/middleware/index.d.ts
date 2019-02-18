import * as Botkit from 'botkit';
import Bluebird = require('bluebird');

declare module 'botkit' {
  interface Message {
    watsonError?: Error | string;
    watsonData?: WatsonMiddleware.Data;
  }
}

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

  interface ContextDelta {
    [index: string]: any;
  }

  interface Payload {
    workspace_id: string;
    input: {
      text: string;
    };
    context?: Context;
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
    storage: {
      users: Botkit.Storage<Botkit.User>;
      channels: Botkit.Storage<Botkit.Channel>;
      teams: Botkit.Storage<Botkit.Team>;
    };
    hear: (patterns: string[], message: Botkit.Message) => boolean;
    before: (
      message: Botkit.Message,
      payload: Payload,
      callback: (err: string | Error, payload: Payload) => void
    ) => void;
    after: (message: Botkit.Message, response, callback) => void;
    sendToWatson: (
      bot: Botkit.Bot<any, Botkit.Message>,
      message: Botkit.Message,
      contextDelta: ContextDelta,
      next: () => void
    ) => void;
    receive: (
      bot: Botkit.Bot<any, Botkit.Message>,
      message: Botkit.Message,
      next: () => void
    ) => void;
    interpret: (
      bot: Botkit.Bot<any, Botkit.Message>,
      message: Botkit.Message,
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
      bot: Botkit.Bot<any, Botkit.Message>,
      message: Botkit.Message,
      contextDelta: ContextDelta
    ) => Bluebird<void>;
    interpretAsync: (
      bot: Botkit.Bot<any, Botkit.Message>,
      message: Botkit.Message
    ) => Bluebird<void>;
    readContextAsync: (user: string) => Bluebird<Context>;
    updateContextAsync: (user: string, context: Context) => Bluebird<Data>;
  }

  export function createWatsonMiddleware(config: MiddlewareConfig): Middleware;
}

export default WatsonMiddleware.createWatsonMiddleware;
export { WatsonMiddleware };
