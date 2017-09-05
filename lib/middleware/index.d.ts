import * as botkit from "botkit";

declare module 'botkit' {
  interface Message {
    watsonError ?: Error | string;
    watsonData ?: WatsonMiddleware.Data;
  }
}

declare namespace WatsonMiddleware {

  interface Data {
    output: OutputData;
    input ?: MessageInput;
    intents ?: RuntimeIntent[];
    entities ?: RuntimeEntity[];
    alternate_intents ?: boolean;
    context ?: Context;
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
    metadata ?: {
      [index: string]: any;
    }
  }

  interface Context {
    conversation_id: string;
    system: any;
    [index: string]: any;
  }

  interface OutputData {
    text: string[];
    log_messages ?: LogMessage[];
    nodes_visited ?: string[];
    [index: string]: any;
  }

  interface LogMessage {
    level: string;
    msg: string;
  }

  interface MiddlewareConfig {
    version_date: string;
    workspace_id: string;
    url ?: string;
    token?: string;
    headers ?: {
      [index: string]: string
    }
    use_unauthenticated ?: boolean;
    username ?: string;
    password ?: string;
    minimum_confidence ?: number;
  }

  interface Middleware {
    minimum_confidence: number,
    conversation: any;
    storage: {
      users: botkit.Storage<botkit.User>;
      channels: botkit.Storage<botkit.Channel>;
      teams: botkit.Storage<botkit.Team>;
    };
    hear: (patterns: string[], message: botkit.Message) => boolean;
    before: (message: botkit.Message, payload: Payload, callback: (err: string | Error, payload: Payload) => void) => void;
    after: (message: botkit.Message, response, callback) => void;
    sendToWatson: (bot: botkit.Bot<any, botkit.Message>, message: botkit.Message, contextDelta: ContextDelta, next: () => void) => void;
    receive: (bot: botkit.Bot<any, botkit.Message>, message: botkit.Message, next: () => void) => void;
    interpret: (bot: botkit.Bot<any, botkit.Message>, message: botkit.Message, next: () => void) => void;
    readContext: (user: string, callback: (err: string | Error | null, context ?: Context) => void) => void;
    updateContext: (user: string, context: Context, callback: (err: string | Error | null, watsonResponse ?: Data) => void) => void;
  }

  interface Payload {
    workspace_id: string;
    input: {
      text: string;
    };
    context ?: Context;
  }

  interface ContextDelta {
    [index: string]: any
  }

  export function createWatsonMiddleware(config: MiddlewareConfig): Middleware;
}

export = WatsonMiddleware.createWatsonMiddleware;
