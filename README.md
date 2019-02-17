# Use IBM Watson's Assistant service to chat with your Botkit-powered Bot! [![Build Status](https://travis-ci.org/watson-developer-cloud/botkit-middleware.svg?branch=master)](https://travis-ci.org/watson-developer-cloud/botkit-middleware) [![Greenkeeper badge](https://badges.greenkeeper.io/watson-developer-cloud/botkit-middleware.svg)](https://greenkeeper.io/)

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to easily integrate a [Watson Assistant](https://www.ibm.com/watson/ai-assistant/) workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

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
$ npm install botkit-middleware-watson --save
```

## Prerequisites

1. Sign up for an [IBM Cloud account](https://console.bluemix.net/registration/).
1. Create an instance of the Watson Assistant service and get your credentials:
    - Go to the [Watson Assistant](https://console.bluemix.net/catalog/services/conversation) page in the IBM Cloud Catalog.
    - Log in to your IBM Cloud account.
    - Click **Create**.
    - Copy the `apikey` value, or copy the `username` and `password` values if your service instance doesn't provide an `apikey`.
    - Copy the `url` value.

1. Create a workspace using the Watson Assistant service and copy the `workspace_id`. If you don't know how to create a workspace follow the [Getting Started tutorial](https://console.bluemix.net/docs/services/conversation/getting-started.html).


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
const slackController = Botkit.slackbot({ clientSigningSecret: YOUR_SLACK_SIGNING_SECRET });
```

Spawn a Slack bot using the controller:
```js
const slackBot = slackController.spawn({
  token: YOUR_SLACK_TOKEN
});
```

Create the middleware object which you'll use to connect to the Watson Assistant service.

If your credentials are `username` and `password` use:

```js
const watsonMiddleware = require('botkit-middleware-watson')({
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
const watsonMiddleware = require('botkit-middleware-watson')({
  iam_apikey: YOUR_API_KEY,
  url: YOUR_ASSISTANT_URL,
  workspace_id: YOUR_WORKSPACE_ID,
  version: '2018-07-10',
  minimum_confidence: 0.50, // (Optional) Default is 0.75
});
```

Tell your Slackbot to use the _watsonMiddleware_ for incoming messages:
```js
slackController.middleware.receive.use(watsonMiddleware.receive);
slackBot.startRTM();
```

Finally, make your bot _listen_ to incoming messages and respond with Watson Assistant:
```js
slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  if (message.watsonError) {
    bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  } else {
    bot.reply(message, message.watsonData.output.text.join('\n'));
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
slackController.hears(['.*'], ['direct_message'], function(bot, message) {
  middleware.interpret(bot, message, function() {
    if (message.watsonError) {
      bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
    } else {
      bot.reply(message, message.watsonData.output.text.join('\n'));
    }
  });
});
```

#### Using middleware wrapper

```js
const receiveMiddleware = function (bot, message, next) {
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
controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention', 'message_received'], function(bot, message) {
  if (message.watsonError) {
    bot.reply(message, "Sorry, there are technical problems.");     // deal with watson error
  } else {
    if (message.watsonData.intents.length == 0) {
      bot.reply(message, "Sorry, I could not understand the message.");     // was any intent recognized?
    } else if (message.watsonData.intents[0].confidence < watsonMiddleware.minimum_confidence) {
      bot.reply(message, "Sorry, I am not sure what you have said.");      // is the confidence high enough?
    } else {
      bot.reply(message, message.watsonData.output.text.join('\n'));      // reply with Watson response
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

Watson Assistant side of app action is documented in [Developer Cloud](https://console.bluemix.net/docs/services/assistant/deploy-custom-app.html#deploy-custom-app)
A common scenario of processing actions is:

* Send message to user "Please wait while I ..."
* Perform action
* Persist results in conversation context
* Send message to Watson with updated context
* Send result message(s) to user.

### using sendToWatson to update context (possible since v1.5.0)

Using sendToWatson to update context simplifies the bot code compared to solution using updateContext below.
```js

function checkBalance(context, callback) {
  //do something real here
  const contextDelta = {
    validAccount: true,
    accountBalance: 95.33
  };
  callback(null, context);
}

const checkBalanceAsync = Promise.promisify(checkBalance);

const processWatsonResponse = function (bot, message) {
  if (message.watsonError) {
    return bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }
  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      const newMessage = clone(message);
      newMessage.text = 'balance result';

      checkBalanceAsync(message.watsonData.context).then(function (contextDelta) {
        return watsonMiddleware.sendToWatsonAsync(bot, newMessage, contextDelta);
      }).catch(function (error) {
        newMessage.watsonError = error;
      }).then(function () {
        return processWatsonResponse(bot, newMessage);
      });
    }
  }
};

controller.on('message_received', processWatsonResponse);
```

#### Using updateContext in controller (available since v1.4.0)

Since 1.4.0 it is possible to update context from controller code.
```js

function checkBalance(context, callback) {
  //this version of function updates only the context object
  context.validAccount = true;
  context.accountBalance = 95.33;
  callback(null, context);
}

const checkBalanceAsync = Promise.promisify(checkBalance);

const processWatsonResponse = function (bot, message) {
  if (message.watsonError) {
    return bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }
  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      const newMessage = clone(message);
      newMessage.text = 'balance result';

      //check balance
      checkBalanceAsync(message.watsonData.context).then(function (context) {
        //update context in storage
        return watsonMiddleware.updateContextAsync(message.user, context);
      }).then(function () {
        //send message to watson (it reads updated context from storage)
        return watsonMiddleware.sendToWatsonAsync(bot, newMessage);
      }).catch(function (error) {
        newMessage.watsonError = error;
      }).then(function () {
        //send results to user
        return processWatsonResponse(bot, newMessage);
      });
    }
  }
};

controller.on('message_received', processWatsonResponse);
```

#### Using middleware.after and controller

Before v1.4.0 only middleware.after callback can update context, and only controller can send replies to user.
The downside is that it is impossible to send "Please wait message".

```js
function checkBalance(watsonResponse, callback) {
  //middleware.after function must pass a complete Watson respose to callback
  watsonResponse.context.validAccount = true;
  watsonResponse.context.accountBalance = 95.33;
  callback(null, watsonResponse);
}

watsonMiddleware.after = function(message, watsonResponse, callback) {
  //real action happens in middleware.after
  if (typeof watsonResponse !== 'undefined' && typeof watsonResponse.output !== 'undefined') {
    if (watsonResponse.output.action === 'check_balance') {
      return checkBalance(watsonResponse, callback);
    }
  }
  callback(null, watsonResponse);
};

const processWatsonResponse = function(bot, message) {
  if (message.watsonError) {
    return bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }

  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      const newMessage = clone(message);
      newMessage.text = 'balance result';
      //send to watson
      watsonMiddleware.interpret(bot, newMessage, function() {
        //send results to user
        processWatsonResponse(bot, newMessage);
      });
    }
  }
};

controller.on('message_received', processWatsonResponse);

```


## Implementing event handlers

Events are messages having type different than `message`.

[Example](https://github.com/howdyai/botkit/blob/master/examples/facebook_bot.js) of handler:
```js
controller.on('facebook_postback', function(bot, message) {
 bot.reply(message, 'Great Choice!!!! (' + message.payload + ')');
});
```
Since they usually have no text, events aren't processed by middleware and have no watsonData attribute.
If event handler wants to make use of some data from context, it has to read it first.
Example:
```js
controller.on('facebook_postback', function(bot, message) {
  watsonMiddleware.readContext(message.user, function(err, context) {
    if (!context) {
      context = {};
    }
    //do something useful here
    myFunction(context.field1, context.field2, function(err, result) {
      const newMessage = clone(message);
      newMessage.text = 'postback result';

      watsonMiddleware.sendToWatson(bot, newMessage, {postbackResult: 'success'}, function(err) {
        if (err) {
          newMessage.watsonError = error;
        }
        processWatsonResponse(bot, newMessage);
      });
    });
  });
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
slackController.hears(['hello'], ['direct_message', 'direct_mention', 'mention'], watsonMiddleware.hear, function(bot, message) {
  bot.reply(message, message.watsonData.output.text.join('\n'));
  // now do something special related to the hello intent
});
```

Used globally:

```js
slackController.changeEars(watsonMiddleware.hear);

slackController.hears(['hello'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  bot.reply(message, message.watsonData.output.text.join('\n'));
  // now do something special related to the hello intent
});
```

#### `before` and `after`

The _before_ and _after_ callbacks can be used to perform some tasks _before_ and _after_ Assistant is called. One may use it to modify the request/response payloads, execute business logic like accessing a database or making calls to external services.

They can be customized as follows:

```js
middleware.before = function(message, assistantPayload, callback) {
  // Code here gets executed before making the call to Assistant.
  callback(null, customizedPayload);
}
```

```js
  middleware.after = function(message, assistantResponse, callback) {
    // Code here gets executed after the call to Assistant.
    callback(null, assistantResponse);
  }
```

#### Dynamic workspace

If you need to make use of multiple workspaces in a single bot, workspace_id can be changed dynamically by setting workspace_id property in context.

Example of setting workspace_id to id provided as a property of hello message:
```js
function handleHelloEvent(bot, message) {
    message.type = 'welcome';
    const contextDelta = {};

    if (message.workspaceId) {
        contextDelta.workspace_id = message.workspaceId;
    }

    watsonMiddleware.sendToWatsonAsync(bot, message, contextDelta).catch(function (error) {
        message.watsonError = error;
    }).then(function () {
        bot.reply(message, message.watsonData.output.text.join('\n'));
    });
}

controller.on('hello', handleHelloEvent);
```

## License

This library is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).
