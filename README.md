# Use IBM Watson's Conversation service to chat with your Botkit-powered Bot!

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to easily integrate their [Watson Conversation](https://www.ibm.com/watson/developercloud/conversation.html) workspace with multiple social channels like Slack, Facebook and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

## Middleware Overview
* Automatically manages context in multi-turn conversations to keep track of where the user left off in the conversation.
* Greater flexibility in message handling.
* Capable of handling external databases for context storage.
* Easy integration with third-party services.
* Exposes the following functions to developers:
  * `before`: pre-process requests before sending to Watson Conversation (Conversation).
  * `after` : post-process responses before forwarding them to Botkit.

## Installation
```
$ npm install botkit-middleware-watson --save
```

## Usage
### Get Watson Conversation credentials
The middleware needs you to provide the `username`, `password` and `workspace_id` of your Watson Conversation chat bot. If you have an existing Conversation service instance, then simply follow [these steps](https://github.com/watson-developer-cloud/conversation-simple/blob/master/README.md#service-credentials) to get your credentials.

If you don't have a Conversation service instance yet, then follow [these steps](https://github.com/watson-developer-cloud/conversation-simple/blob/master/README.md#before-you-begin-1) to get started.

### Get channel credentials
This document shows code snippets for using a Slack bot with the middleware. Look at the [examples/multi-bot](/examples/multi-bot) folder for a multi-bot example app showing how to connect to Slack, Facebook and Twilio IPM bots running on a single Express server.

You'll need a _Slack token_ for your Slack bot to talk to Conversation.
If you have an existing Slack bot, then just grab the Slack token from your Slack settings page.

Otherwise, follow [these instructions](https://github.com/howdyai/botkit/blob/master/readme-slack.md) by Botkit to create your Slack bot from scratch. You will be provided with a Slack token when your bot is ready.

### Bot setup

This section walks you through code snippets to set up your Slack bot. If you want, you can jump straight to the full example [here](/examples/simple-bot).

In your app, add the following lines to create your Slack controller using Botkit:
```js
var slackController = Botkit.slackbot();
```

Spawn a Slack bot using the controller:
```js
var slackBot = slackController.spawn({
    token: YOUR_SLACK_TOKEN,
    bot_type: 'slack'
});
```
Notice how we add the _bot_type_ property so the middleware knows the source of the incoming message.

Create the middleware object which you'll use to connect to Conversation service:
```js
var watsonMiddleware = require('botkit-middleware-watson');
```

Tell your Slackbot to use the _watsonMiddleware_ for incoming messages:
```js
slackController.middleware.receive.use(watsonMiddleware.receive);
slackBot.startRTM();
watsonMiddleware.slack = slackController;
```

Finally, make your bot _listen_ to incoming messages and respond with Watson Conversation:
```js
slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    bot.reply(message, message.watsonData.output.text.join('\n'));
});
```
The middleware attaches the `watsonData` object to _message_. This contains the text response from Conversation.

You're all set! :)
