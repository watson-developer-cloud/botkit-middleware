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

var storagePrefix = 'user.';

var readContext = function (userId, storage) {
  var itemId = storagePrefix + userId;
  return storage.read([itemId]).then(function(result) {
    if (typeof result[itemId] !== 'undefined' && result[itemId].context) {
      debug('User: %s, Context: %s', userId, JSON.stringify(result[itemId].context, null, 2));
      return result[itemId].context;
    }
    return null;
  }).catch(function (err) {
    debug('User: %s, read context error: %s', userId, err);
    return null;
  });
};

var updateContext = function (userId, storage, watsonResponse) {
  var itemId = storagePrefix + userId;
  return storage.read([itemId]).then(function(result) {
    if (typeof result[itemId] !== 'undefined') {
      debug('User: %s, Data: %s', userId, JSON.stringify(result[itemId], null, 2));
      return result[itemId];
    }
    return null;
  }).then(function (userData) {
    if (userData == null) {
      userData = {};
    }
    userData.id = userId;
    userData.context = watsonResponse.context;
    var changes = {};
    changes[itemId] = userData;
    return storage.write(changes);
  }).then(function () {
    return watsonResponse;
  });
};

var postMessage = function (conversation, payload, callback) {
  debug('Assistant Request: %s', JSON.stringify(payload, null, 2));
  conversation.message(payload)
    .then(response => {
      debug('Assistant Response: %s', JSON.stringify(response, null, 2));
      callback(null, response);
    })
    .catch(callback);
};

var asCallback = function (promise, cb) {
  if (typeof cb !== 'function') {
    cb = function() {};
  }

  return promise.then((result) => {
    cb(null, result);
    return promise;
  }).catch((err) => {
    cb(err);
    return promise;
  });
};

module.exports = {
  readContext: readContext,
  updateContext: updateContext,
  postMessage: postMessage,
  asCallback: asCallback
};
