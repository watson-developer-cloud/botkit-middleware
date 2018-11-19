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
var AssistantV1 = require('watson-developer-cloud/assistant/v1');
var watsonUtils = require('./utils');
var deepMerge = require('deepmerge');

var readContext = Promise.promisify(watsonUtils.readContext);
var updateContext = Promise.promisify(watsonUtils.updateContext);
var postMessage = Promise.promisify(watsonUtils.postMessage);

// These are initiated by Slack itself and not from the end-user. Won't send these to WCS.
var ignoreType = ['presence_change', 'reconnect_url'];

module.exports = function (config) {

  if (!config) {
    throw new Error('Watson Assistant config parameters absent.');
  }

  if (config.version_date) {
    console.warn('"version_date" is deprecated and will be removed in the next major release. Use "version"');
    config.version = config.version_date;
    delete config.version_date;
  }

  var middleware = {

    minimum_confidence: (config.minimum_confidence || 0.75),

    hear: function (patterns, message) {

      if (message.watsonData && message.watsonData.intents) {
        for (var p = 0; p < patterns.length; p++) {
          for (var i = 0; i < message.watsonData.intents.length; i++) {
            if (message.watsonData.intents[i].intent === patterns[p] &&
              message.watsonData.intents[i].confidence >= middleware.minimum_confidence) {
              return true;
            }
          }
        }
      }
      return false;
    },

    before: function (message, payload, callback) {
      callback(null, payload);
    },

    after: function (message, response, callback) {
      callback(null, response);
    },

    sendToWatson: function (bot, message, contextDelta, next) {
      var before = Promise.promisify(middleware.before);
      var after = Promise.promisify(middleware.after);

      if (!next && typeof contextDelta === 'function') {
        next = contextDelta;
        contextDelta = null;
      }

      if (!middleware.conversation) {
        debug('Creating Assistant object with parameters: ' + JSON.stringify(config, null, 2));
        middleware.conversation = new AssistantV1(config);
      }

      if ((!message.text && message.type !== 'welcome') || ignoreType.indexOf(message.type) !== -1 || message.reply_to || message.bot_id) {
        // Ignore messages initiated by Slack. Reply with dummy output object
        message.watsonData = {
          output: {
            text: []
          }
        };
        return next();
      }

      middleware.storage = bot.botkit.storage;

      readContext(message.user, middleware.storage).then(function (userContext) {
        var payload = {
          workspace_id: config.workspace_id
        };
        if (message.text) {
          // text can not contain the following characters: tab, new line, carriage return.
          var sanitizedText = message.text.replace(/[\r\n\t]/g, ' ');
          payload.input = {
            text: sanitizedText
          };
        }
        if (userContext) {
          payload.context = userContext;
        }
        if (contextDelta) {
          if (!userContext) {
            //nothing to merge, this is the first context
            payload.context = contextDelta;
          } else {
            payload.context = deepMerge(payload.context, contextDelta);
          }
        }
        if (payload.context && payload.context.workspace_id && payload.context.workspace_id.length === 36) {
          payload.workspace_id = payload.context.workspace_id;
        }
        return payload;
      }).then(function (payload) {
        return before(message, payload);
      }).then(function (watsonRequest) {
        return postMessage(middleware.conversation, watsonRequest);
      }).then(function (watsonResponse) {
        return after(message, watsonResponse);
      }).then(function (watsonResponse) {
        message.watsonData = watsonResponse;
        return updateContext(message.user, middleware.storage, watsonResponse);
      }).catch(function (error) {
        message.watsonError = error;
        debug('Error: %s', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }).done(function () {
        next();
      });
    }
  };

  middleware.receive = function (bot, message, next) {
    return middleware.sendToWatson(bot, message, null, next);
  };

  middleware.interpret = middleware.receive;


  middleware.readContext = function (user, callback) {
    if (!middleware.storage) {
      return callback(new Error('readContext is called before the first middleware.receive call'));
    }
    return watsonUtils.readContext(user, middleware.storage, callback);
  };

  middleware.updateContext = function (user, context, callback) {
    if (!middleware.storage) {
      return callback(new Error('updateContext is called before the first middleware.receive call'));
    }
    watsonUtils.updateContext(
      user,
      middleware.storage, {
        context: context
      },
      callback
    );
  };

  middleware.interpretAsync = Promise.promisify(middleware.interpret, {
    context: middleware
  });
  middleware.sendToWatsonAsync = Promise.promisify(middleware.sendToWatson, {
    context: middleware
  });
  middleware.readContextAsync = Promise.promisify(middleware.readContext, {
    context: middleware
  });
  middleware.updateContextAsync = Promise.promisify(middleware.updateContext, {
    context: middleware
  });

  debug('Middleware: ' + JSON.stringify(middleware, null, 2));
  return middleware;
};
