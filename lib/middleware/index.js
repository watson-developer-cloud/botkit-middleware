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

var debug = require('debug')('watson-middleware:index');
var Promise = require('bluebird');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var watsonUtils = require('./utils');

var readContext = Promise.promisify(watsonUtils.readContext);
var updateContext = Promise.promisify(watsonUtils.updateContext);
var postMessage = Promise.promisify(watsonUtils.postMessage);

// These are initiated by Slack itself and not from the end-user. Won't send these to WCS.
var ignoreType = ['presence_change', 'reconnect_url'];

var middleware = {
  workspace: process.env.WORKSPACE_ID,

  before: function(message, payload, callback) {
    callback(null, payload);
  },

  after: function(message, response, callback) {
    callback(null, response);
  },

  receive: function(bot, message, next) {

    var before = Promise.promisify(middleware.before);
    var after = Promise.promisify(middleware.after);

    if (!middleware.conversation) {
      debug('Creating Conversation object.');
      middleware.conversation = new ConversationV1({
        version_date: '2016-09-20'
      });
    }

    if (!message.text || ignoreType.indexOf(message.type) !== -1 || message.reply_to) {
      // Ignore messages initiated by Slack. Reply with dummy output object
      message.watsonData = {
        output: {
          text: []
        }
      };
      return message;
    }

    middleware.storage = bot.botkit.storage;

    readContext(message.user, middleware.storage).then(function(userContext) {
      var payload = {
        workspace_id: middleware.workspace,
        input: {
          text: message.text
        }
      };
      if (userContext) {
        payload.context = userContext;
      }
      return payload;
    }).then(function(payload) {
      return before(message, payload);
    }).then(function(watsonRequest) {
      return postMessage(middleware.conversation, watsonRequest);
    }).then(function(watsonResponse) {
      message.watsonData = watsonResponse;
      return updateContext(message.user, middleware.storage, watsonResponse);
    }).then(function(watsonResponse) {
      return after(message, watsonResponse);
    }).catch(function(error) {
      debug('Error: %s', JSON.stringify(error, null, 2));
    }).done(function(response) {
      next();
    });
  }
};

module.exports = middleware;
