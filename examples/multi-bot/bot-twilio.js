/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
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

var Botkit = require('botkit');

var controller = Botkit.twilioipmbot();
var bot = controller.spawn({
  TWILIO_IPM_SERVICE_SID: process.env.TWILIO_IPM_SERVICE_SID,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY: process.env.TWILIO_API_KEY,
  TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  identity: process.env.BOT_NAME,
  autojoin: true
});
controller.hears(['.*'], 'message_received', function(bot, message) {
  if (message.watsonError) {
    console.log(message.watsonError);
    bot.reply(message, message.watsonError.description || message.watsonError.error);
  } else if (message.watsonData && 'output' in message.watsonData) {
    bot.reply(message, message.watsonData.output.text.join('\n'));
  } else {
    console.log('Error: received message in unknown format. (Is your connection with Watson Conversation up and running?)');
    bot.reply(message, 'I\'m sorry, but for technical reasons I can\'t respond to your message');
  }
});

module.exports.controller = controller;
module.exports.bot = bot;
