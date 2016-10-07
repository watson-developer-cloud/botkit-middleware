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
var debug = require('debug')('watson-middleware:utils');

module.exports = {
  chooseStorage: function(message, bot, middleware, callback) {
    if (middleware.storage) {
      debug('Reusing existing storage.');
      callback(null, middleware.storage);
    }
    var storage = null;
    // Use the botType property to distinguish between bots
    if (bot.bot_type === 'Facebook') {
      storage = middleware.facebook.storage;
      debug('Using Facebook storage.');
    } else if (bot.bot_type === 'Twilio') {
      storage = middleware.twilio.storage;
      debug('Using Twilio storage.');
    } else {
      storage = middleware.slack.storage;
      debug('Using Slack storage.'); //Default is Slack storage
    }
    callback(null, storage);
  },

  readContext: function(message, storage, callback) {
    storage.users.get(message.user, function(err, user_data) {
      if (user_data && user_data.context) {
        debug('User: %s, Context: %s', message.user, JSON.stringify(user_data.context, null, 2));
        callback(null, user_data.context);
      } else {
        debug('User: %s, Context: %s', message.user, JSON.stringify(null));
        callback(null, null);
      }
    });
  },

  updateContext: function(userId, storage, watsonResponse, callback) {
    storage.users.save({
      id: userId,
      context: watsonResponse.context
    }, function(err) {
      callback(err);
    });
    callback(null, watsonResponse);
  },

  postMessage: function(conversation, payload, callback) {
    debug('Conversation Request: %s', JSON.stringify(payload, null, 2));
    conversation.message(payload, function(err, response) {
      if (err) {
        callback(err);
      } else {
        debug('Conversation Response: %s', JSON.stringify(response, null, 2));
        callback(null, response);
      }
    });
  }
};
