# Use IBM Watson's Conversation service to chat with your Botkit-powered Bot! [![Build Status](https://travis-ci.org/watson-developer-cloud/botkit-middleware.svg?branch=master)](https://travis-ci.org/watson-developer-cloud/botkit-middleware)

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to easily integrate a [Watson Conversation](https://www.ibm.com/watson/developercloud/conversation.html) workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

## Middleware Overview
* Automatically manages context in multi-turn conversations to keep track of where the user left off in the conversation.
* Allows greater flexibility in message handling.
* Handles external databases for context storage.
* Easily integrates with third-party services.
* Exposes the following functions to developers:
  * `before`: pre-process requests before sending to Watson Conversation (Conversation).
  * `after` : post-process responses before forwarding them to Botkit.

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

Otherwise, follow [Botkit's instructions](https://github.com/howdyai/botkit/blob/master/readme-slack.md) to create your Slack bot from scratch. When your bot is ready, you are provided with a Slack token.

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
  version_date: '2016-09-20'
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
    bot.reply(message, message.watsonData.output.text.join('\n'));
});
```
The middleware attaches the `watsonData` object to _message_. This contains the text response from Conversation.

Then you're all set!

### Using `before` and `after` functions

The _before_ and _after_ callbacks are available through the _watsonMiddleware_ object.

These can be customized as follows:

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

### Hearing intents

The Watson middleware also includes a `hears()` middleware which provides a mechanism to
developers to fire handler functions based on the most likely intent of the user.
This allows a developer to create handler functions for specific intents in addition
to using the data provided by Watson to power the conversation.

The `hears()` middleware can be used on individual handler functions, or can be used globally.

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

This comes in handy to:
- Make database updates
- Update the context in the payload
- Call some external service before/after calling Conversation

## License

This library is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).
