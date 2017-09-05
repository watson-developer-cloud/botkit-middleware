# Use IBM Watson's Conversation service to chat with your Botkit-powered Bot! [![Build Status](https://travis-ci.org/watson-developer-cloud/botkit-middleware.svg?branch=master)](https://travis-ci.org/watson-developer-cloud/botkit-middleware)

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to easily integrate a [Watson Conversation](https://www.ibm.com/watson/developercloud/conversation.html) workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

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
* `before`: [pre-process](#before-and-after) requests before sending to Watson Conversation (Conversation).
* `after`: [post-process](#before-and-after) responses before forwarding them to Botkit.


## Installation

```sh
$ npm install botkit-middleware-watson --save
```

## Usage

### Acquire Watson Conversation credentials

The middleware needs you to provide the `username`, `password`, and `workspace_id` of your Watson Conversation chat bot. If you have an existing Conversation service instance, follow [these steps](https://github.com/watson-developer-cloud/conversation-simple/blob/master/README.md#configuring-the-application-environmnet) to get your credentials.

If you do not have a Conversation service instance,  follow [these steps](https://github.com/watson-developer-cloud/conversation-simple/blob/master/README.md#before-you-begin) to get started.

### Acquire channel credentials
This document shows code snippets for using a Slack bot with the middleware. (If you want examples for the other channels, see the [examples/multi-bot](/examples/multi-bot) folder. The multi-bot example app shows how to connect to Slack, Facebook, and Twilio IPM bots running on a single Express server.)

You need a _Slack token_ for your Slack bot to talk to Conversation.

If you have an existing Slack bot, then copy the Slack token from your Slack settings page.

Otherwise, follow [Botkit's instructions](https://github.com/howdyai/botkit/blob/master/docs/readme-slack.md) to create your Slack bot from scratch. When your bot is ready, you are provided with a Slack token.

### Bot setup

This section walks you through code snippets to set up your Slack bot. If you want, you can jump straight to the [full example](/examples/simple-bot).

In your app, add the following lines to create your Slack controller using Botkit:
```js
var slackController = Botkit.slackbot();
```

Spawn a Slack bot using the controller:
```js
var slackBot = slackController.spawn({
  token: YOUR_SLACK_TOKEN
});
```

Create the middleware object which you'll use to connect to the Conversation service:
```js
var watsonMiddleware = require('botkit-middleware-watson')({
  username: YOUR_CONVERSATION_USERNAME,
  password: YOUR_CONVERSATION_PASSWORD,
  workspace_id: YOUR_WORKSPACE_ID,
  version_date: '2017-05-26',
  minimum_confidence: 0.50, // (Optional) Default is 0.75
});
```

Tell your Slackbot to use the _watsonMiddleware_ for incoming messages:
```js
slackController.middleware.receive.use(watsonMiddleware.receive);
slackBot.startRTM();
```

Finally, make your bot _listen_ to incoming messages and respond with Watson Conversation:
```js
slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  if (message.watsonError) {
    bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  } else {
    bot.reply(message, message.watsonData.output.text.join('\n'));
  }
});
```
The middleware attaches the `watsonData` object to _message_. This contains the text response from Conversation.
If any error happened in middleware, error is assigned to `watsonError` property of the _message_.

Then you're all set!

## Features

### Message filtering

When middleware is registered, the receive function is triggered on _every_ message.
If you would like to make your bot to only respond to _direct messages_ using Conversation, you can achieve this in 2 ways:

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
var receiveMiddleware = function (bot, message, next) {
  if (message.type === 'direct_message') {
    watsonMiddleware.receive(bot, message, next);
  } else {
    next();
  }
};

slackController.middleware.receive.use(receiveMiddleware);
```


### Implementing app actions

Conversation side of app action is documented in [Developer Cloud](https://www.ibm.com/watson/developercloud/doc/conversation/develop-app.html#implementing-app-actions)
A common scenario of processing actions is
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

  var contextDelta = {
    validAccount: true,
    accountBalance: 95.33
  };
  callback(null, context);
}

Promise.promisifyAll(watsonMiddleware);
var checkBalanceAsync = Promise.promisify(checkBalance);

var processWatsonResponse = function (bot, message) {
  if (message.watsonError) {
    return bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }
  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      var newMessage = clone(message);
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

Promise.promisifyAll(watsonMiddleware);
var checkBalanceAsync = Promise.promisify(checkBalance);

var processWatsonResponse = function (bot, message) {
  if (message.watsonError) {
    return bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }
  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      var newMessage = clone(message);
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

var processWatsonResponse = function(bot, message) {
  if (message.watsonError) {
    return bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
  }

  if (typeof message.watsonData.output !== 'undefined') {
    //send "Please wait" to users
    bot.reply(message, message.watsonData.output.text.join('\n'));

    if (message.watsonData.output.action === 'check_balance') {
      var newMessage = clone(message);
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

The _before_ and _after_ callbacks can be used to perform some tasks _before_ and _after_ Conversation is called. One may use it to modify the request/response payloads, execute business logic like accessing a database or making calls to external services.

They can be customized as follows:

```js
middleware.before = function(message, conversationPayload, callback) {
  // Code here gets executed before making the call to Conversation.
  callback(null, customizedPayload);
}
```

```js
  middleware.after = function(message, conversationResponse, callback) {
    // Code here gets executed after the call to Conversation.
    callback(null, conversationResponse);
  }
```

## License

This library is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).
