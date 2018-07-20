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

var readContext = function (userId, storage, callback) {
  storage.users.get(userId, function (err, user_data) {
    if (err) {
      //error is returned if nothing is stored yet, so it is the best to ignore it
      debug('User: %s, read context error: %s', userId, err);
    }

    if (user_data && user_data.context) {
      debug('User: %s, Context: %s', userId, JSON.stringify(user_data.context, null, 2));
      callback(null, user_data.context);
    } else {
      debug('User: %s, Context: %s', userId, JSON.stringify(null));
      callback(null, null);
    }
  });
};

var updateContext = function (userId, storage, watsonResponse, callback) {
  storage.users.get(userId, function (err, user_data) {
    if (err) {
      //error is returned if nothing is stored yet, so it is the best to ignore it
      debug('User: %s, read context error: %s', userId, err);
    }

    if (!user_data) {
      user_data = {};
    }
    user_data.id = userId;
    user_data.context = watsonResponse.context;

    storage.users.save(user_data, function (err) {
      if (err) return callback(err);

      debug('User: %s, Updated Context: %s', userId, JSON.stringify(watsonResponse.context, null, 2));
      callback(null, watsonResponse);
    });
  });
};

var postMessage = function (conversation, payload, callback) {
  debug('Assistant Request: %s', JSON.stringify(payload, null, 2));
  conversation.message(payload, function (err, response) {
    if (err) return callback(err);

    debug('Assistant Response: %s', JSON.stringify(response, null, 2));
    callback(null, response);
  });
};

module.exports = {
  readContext: readContext,
  updateContext: updateContext,
  postMessage: postMessage
};