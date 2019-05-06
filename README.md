# Use IBM Watson's Assistant service to chat with your Botkit-powered Bot! [![Build Status](https://travis-ci.org/watson-developer-cloud/botkit-middleware.svg?branch=master)](https://travis-ci.org/watson-developer-cloud/botkit-middleware) [![Greenkeeper badge](https://badges.greenkeeper.io/watson-developer-cloud/botkit-middleware.svg)](https://greenkeeper.io/)

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to easily integrate a [Watson Assistant](https://www.ibm.com/watson/ai-assistant/) workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

<details>
  <summary>Table of Contents</summary>

* [Middleware Overview](#middleware-overview)
* [Function Overview](#function-overview)
* [Installation](#installation)
* [Prerequisites](#prerequisites)
  + [Acquire channel credentials](#acquire-channel-credentials)
  + [Bot setup](#bot-setup)
* [Features](#features)
  + [Message filtering](#message-filtering)
    - [Using interpret function instead of registering middleware](#using-interpret-function-instead-of-registering-middleware)
    - [Using middleware wrapper](#using-middleware-wrapper)
  + [Minimum Confidence](#minimum-confidence)
    - [Use it manually in your self-defined controller.hears() function(s)](#use-it-manually-in-your-self-defined-controllerhears-functions)
    - [Use the middleware's hear() function](#use-the-middlewares-hear-function)
  + [Implementing app actions](#implementing-app-actions)
  + [Using sendToWatson to update context](#using-sendtowatson-to-update-context)
* [Implementing event handlers](#implementing-event-handlers)
  + [Intent matching](#intent-matching)
    - [`before` and `after`](#before-and-after)
    - [Dynamic workspace](#dynamic-workspace)

</details>

## Middleware Overview

* Automatically manages context in multi-turn conversations to keep track of where the user left off in the conversation.
* Allows greater flexibility in message handling.
* Handles external databases for context storage.
* Easily integrates with third-party services.
* Exposes the following functions to developers:

## Function Overview

* `receive`: used as [middleware in Botkit](#bot-setup).
* `interpret`: an alias of `receive`, used in [message-filtering](#message-filtering) and [implementing app actions](#implementing-app-actions).
* `sendToWatson`: same as above, but it can update context before making request, used in [implementing app actions](#implementing-app-actions).
* `hear`: used for [intent matching](#intent-matching).
* `updateContext`: used in [implementing app actions](#implementing-app-actions) (sendToWatson does it better now).
* `readContext`: used in [implementing event handlers](#implementing-event-handlers).
* `before`: [pre-process](#before-and-after) requests before sending to Watson Assistant (formerly Conversation).
* `after`: [post-process](#before-and-after) responses before forwarding them to Botkit.


## Installation

```sh
$ npm install botkit-middleware-watson
```

## Prerequisites

1. Sign up for an [IBM Cloud account](https://cloud.ibm.com/registration/).
1. Create an instance of the Watson Assistant service and get your credentials:
    - Go to the [Watson Assistant](https://cloud.ibm.com/catalog/services/conversation) page in the IBM Cloud Catalog.
    - Log in to your IBM Cloud account.
    - Click **Create**.
    - Copy the `apikey` value, or copy the `username` and `password` values if your service instance doesn't provide an `apikey`.
    - Copy the `url` value.

1. Create a workspace using the Watson Assistant service and copy the `workspace_id`. If you don't know how to create a workspace follow the [Getting Started tutorial](https://cloud.ibm.com/docs/services/conversation/getting-started.html).


### Acquire channel credentials
This document shows code snippets for using a Slack bot with the middleware. (If you want examples for the other channels, see the [examples/multi-bot](/examples/multi-bot) folder.
The multi-bot example app shows how to connect to Slack, Facebook, and Twilio IPM bots running on a single Express server.)

You need a _Slack token_ for your Slack bot to talk to Watson Assistant.

If you have an existing Slack bot, then copy the Slack token from your Slack settings page.

Otherwise, follow [Botkit's instructions](https://botkit.ai/docs/provisioning/slack-events-api.html) to create your Slack bot from scratch. When your bot is ready, you are provided with a Slack token.

### Bot setup

This section walks you through code snippets to set up your Slack bot. If you want, you can jump straight to the [full example](/examples/simple-bot).

In your app, add the following lines to create your Slack controller using Botkit:
```js
import { WatsonMiddleware } from 'botkit-middleware-watson';
import Botkit = require('botkit');
const { SlackAdapter } = require('botbuilder-adapter-slack');

const adapter = new SlackAdapter({
    clientSigningSecret: process.env.SLACK_SECRET,
    botToken: process.env.SLACK_TOKEN
});

const controller = new Botkit({
    adapter,
    // ...other options
});
```



Create the middleware object which you'll use to connect to the Watson Assistant service.

If your credentials are `username` and `password` use:

```js
const watsonMiddleware = new WatsonMiddleware({
  username: YOUR_ASSISTANT_USERNAME,
  password: YOUR_ASSISTANT_PASSWORD,
  url: YOUR_ASSISTANT_URL,
  workspace_id: YOUR_WORKSPACE_ID,
  version: '2018-07-10',
  minimum_confidence: 0.50, // (Optional) Default is 0.75
});
```

If your credentials is `apikey` use:

```js
const watsonMiddleware = new WatsonMiddleware({
  iam_apikey: YOUR_API_KEY,
  url: YOUR_ASSISTANT_URL,
  workspace_id: YOUR_WORKSPACE_ID,
  version: '2018-07-10',
  minimum_confidence: 0.50, // (Optional) Default is 0.75
});
```

Tell your Slackbot to use the _watsonMiddleware_ for incoming messages:
```js
controller.middleware.receive.use(watsonMiddleware.receive.bind(watsonMiddleware));
```

Finally, make your bot _listen_ to incoming messages and respond with Watson Assistant:
```js
controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], async function(bot, message) {
  if (message.watsonError) {
    await  bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  } else {
    await bot.reply(message, message.watsonData.output.text.join('\n'));
  }
});
```
The middleware attaches the `watsonData` object to _message_. This contains the text response from Assistant.
If any error happened in middleware, error is assigned to `watsonError` property of the _message_.

Then you're all set!

## Features

### Message filtering

When middleware is registered, the receive function is triggered on _every_ message.
If you would like to make your bot to only respond to _direct messages_ using Assistant, you can achieve this in 2 ways:

#### Using interpret function instead of registering middleware

```js
slackController.hears(['.*'], ['direct_message'], async (bot, message) => {
  await middleware.interpret(bot, message)
  if (message.watsonError) {
    bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  } else {
    bot.reply(message, message.watsonData.output.text.join('\n'));
  }
});
```

#### Using middleware wrapper

```js
const receiveMiddleware = (bot, message, next) => {
  if (message.type === 'direct_message') {
    watsonMiddleware.receive(bot, message, next);
  } else {
    next();
  }
};

slackController.middleware.receive.use(receiveMiddleware);
```

### Minimum Confidence

To use the setup parameter `minimum_confidence`, you have multiple options:

#### Use it manually in your self-defined controller.hears() function(s)

For example:
```js
controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention', 'message_received'], async (bot, message) => {
  if (message.watsonError) {
    await bot.reply(message, "Sorry, there are technical problems.");     // deal with watson error
  } else {
    if (message.watsonData.intents.length == 0) {
      await bot.reply(message, "Sorry, I could not understand the message.");     // was any intent recognized?
    } else if (message.watsonData.intents[0].confidence < watsonMiddleware.minimum_confidence) {
      await bot.reply(message, "Sorry, I am not sure what you have said.");      // is the confidence high enough?
    } else {
      await bot.reply(message, message.watsonData.output.text.join('\n'));      // reply with Watson response
    }
  }
});
```

#### Use the middleware's hear() function

You can find the default implementation of this function [here](https://github.com/watson-developer-cloud/botkit-middleware/blob/e29b002f2a004f6df57ddf240a3fdf8cb28f95d0/lib/middleware/index.js#L40). If you want, you can redefine this function in the same way that watsonMiddleware.before and watsonMiddleware.after can be redefined. Refer to the [Botkit Middleware documentation](https://botkit.ai/docs/core.html#controllerhears) for an example. Then, to use this function instead of Botkit's default pattern matcher (that does not use minimum_confidence), plug it in using:
```js
controller.changeEars(watsonMiddleware.hear)
```

Note: if you want your own `hear()` function to implement pattern matching like Botkit's default one, you will likely need to implement that yourself. Botkit's default set of 'ears' is the `hears_regexp` function which is implemented [here](https://github.com/howdyai/botkit/blob/77b7d7f80c46d5c8194453667d22118b7850e252/lib/CoreBot.js#L1187).

### Implementing app actions

Watson Assistant side of app action is documented in [Developer Cloud](https://cloud.ibm.com/docs/services/assistant/deploy-custom-app.html#deploy-custom-app)
A common scenario of processing actions is:

* Send message to user "Please wait while I ..."
* Perform action
* Persist results in conversation context
* Send message to Watson with updated context
* Send result message(s) to user.

### Using sendToWatson to update context

Using sendToWatson to update context simplifies the bot code compared to solution using updateContext below.

```js
const checkBalance =  async (context) => {
  //do something real here
  const contextDelta = {
    validAccount: true,
    accountBalance: 95.33
  };
  return context;
});

const processWatsonResponse = async (bot, message) => {
  if (message.watsonError) {
    return await bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }
  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    await bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      const newMessage = clone(message);
      newMessage.text = 'balance result';

      try {
        const contextDelta = await checkBalance(message.watsonData.context);
        await watsonMiddleware.sendToWatson(bot, newMessage, contextDelta);
      } catch(error) {
        newMessage.watsonError = error;
      }
      return await processWatsonResponse(bot, newMessage);
    }
  }
};

controller.on('message_received', processWatsonResponse);
```

## Implementing event handlers

Events are messages having type different than `message`.

[Example](https://github.com/howdyai/botkit/blob/master/packages/docs/reference/facebook.md#facebookeventtypemiddleware) of handler:

```js
controller.on('facebook_postback', async (bot, message) => {
 await bot.reply(message, `Great Choice. (${message.payload})`);
});
```

Since they usually have no text, events aren't processed by middleware and have no watsonData attribute.
If event handler wants to make use of some data from context, it has to read it first.
Example:

```js
controller.on('facebook_postback', async (bot, message) => {
  const context = watsonMiddleware.readContext(message.user);
    //do something useful here
  const result = await myFunction(context.field1, context.field2);
  const newMessage = {...message, text: 'postback result' };
  await watsonMiddleware.sendToWatson(bot, newMessage, { postbackResult: 'success' });
});
```


### Intent matching

The Watson middleware also includes a `hear()` function which provides a mechanism to
developers to fire handler functions based on the most likely intent of the user.
This allows a developer to create handler functions for specific intents in addition
to using the data provided by Watson to power the conversation.

The `hear()` function can be used on individual handler functions, or can be used globally.

Used on an individual handler:

```js
slackController.hears(['hello'], ['direct_message', 'direct_mention', 'mention'], watsonMiddleware.hear, async function(bot, message) {
  await bot.reply(message, message.watsonData.output.text.join('\n'));
  // now do something special related to the hello intent
});
```

Used globally:

```js
slackController.changeEars(watsonMiddleware.hear.bind(watsonMiddleware));

slackController.hears(['hello'], ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
  await bot.reply(message, message.watsonData.output.text.join('\n'));
  // now do something special related to the hello intent
});
```

#### `before` and `after`

The _before_ and _after_ async calls can be used to perform some tasks _before_ and _after_ Assistant is called. One may use it to modify the request/response payloads, execute business logic like accessing a database or making calls to external services.

They can be customized as follows:

```js
middleware.before = (message, assistantPayload) => async () => {
   // Code here gets executed before making the call to Assistant.
  return assistantPayload;
}
```

```js
middleware.after = (message, assistantResponse) => async () => {
  // Code here gets executed after the call to Assistant.
  return assistantResponse;
});
```

#### Dynamic workspace

If you need to make use of multiple workspaces in a single bot, `workspace_id` can be changed dynamically by setting `workspace_id` property in context.

Example of setting `workspace_id` to id provided as a property of hello message:
```js
async handleHelloEvent = (bot, message) => {
  message.type = 'welcome';
  const contextDelta = {};

  if (message.workspaceId) {
    contextDelta.workspace_id = message.workspaceId;
  }

  try {
    await watsonMiddleware.sendToWatson(bot, message, contextDelta);
  } catch(error) {
    message.watsonError = error;
  }
  await bot.reply(message, message.watsonData.output.text.join('\n'));
}

controller.on('hello', handleHelloEvent);
```

## License

This library is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).
