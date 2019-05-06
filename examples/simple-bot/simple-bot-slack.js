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

require('dotenv').config();

const { Botkit } = require('botkit');
const { MemoryStorage } = require('botbuilder');
const { SlackAdapter } = require('botbuilder-adapter-slack');

const express = require('express');
const WatsonMiddleware = require('botkit-middleware-watson').WatsonMiddleware;

const middleware = new WatsonMiddleware({
  iam_apikey: process.env.ASSISTANT_IAM_APIKEY,
  workspace_id: process.env.WORKSPACE_ID,
  url: process.env.ASSISTANT_URL || 'https://gateway.watsonplatform.net/assistant/api',
  version: '2018-07-10'
});

// Configure your bot.
const adapter = new SlackAdapter({
  clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
  botToken: process.env.SLACK_TOKEN,
});
const controller = new Botkit({
    adapter,
    storage: new MemoryStorage(),
    // ...other options
});


controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
  console.log('Slack message received');
  await middleware.interpret(bot, message);
  if (message.watsonError) {
    console.log(message.watsonError);
    await bot.reply(message, message.watsonError.description || message.watsonError.error);
  } else if (message.watsonData && 'output' in message.watsonData) {
    await bot.reply(message, message.watsonData.output.text.join('\n'));
  } else {
    console.log('Error: received message in unknown format. (Is your connection with Watson Assistant up and running?)');
    await bot.reply(message, 'I\'m sorry, but for technical reasons I can\'t respond to your message');
  }
});

// Create an Express app
const app = express();
const port = process.env.PORT || 5000;
app.set('port', port);
app.listen(port, function() {
  console.log('Client server listening on port ' + port);
});
