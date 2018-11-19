## v1.8.0

* Added semantic-releases
* Update node-sdk to 3.7.0
* Update to use the Watson Assistant class

## v1.6.1

* Fixed function signatures in Typescript definition file

## v1.6.0

* New methods sendToWatsonAsync, interpretAsync, readContextAsync, updateContextAsync return promises.

## v1.5.0

* Exported readContext method.
* sendToWatson method can update context.
* Added Typescript definition.
* Empty message with type=welcome can be used to indicate welcome event.

## v1.4.2

 * Fixed critical issue introduced in v1.4.1
 * updateContext fails on first write for a new user when simple storage is used (It happens because simple storage returns an error when record does not exist).

## v1.4.1

* `updateContext` actually preserves other data stored in users storage

## v1.4.0

The following changes were introduced with the v1.4.0 release:
* Added `updateContext` function to middleware.
* `interpret` is just an alias of `receive`.
* `sendToWatson` is a new alias of `receive`.
* Fixed error handling in `utils.updateContext`.
* If any error happens in `receive`, it is assigned to `message.watsonError`

## v1.3.1

Added minimum confidence like optional config parameter

  ```javascript
  var middleware = require('botkit-middleware-watson')({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID,
  minimum_confidence: 0.50, // (Optional) Default is 0.75
  });
  ```

## v1.3.0

Fixed the parameters for the after() call in the interpret function.

## v1.2.0

Fixed the invocation of after() in _receive_ and _interpret_. The order of invocation is now:
 * before()
 * conversation()
 * after()

## v1.1.0

The following changes were introduced with the v1.1.0 release:

 * Added `interpret` function to middleware. It is to be used when you need to send only _heard_ utterances to Watson.
  Works like the receive function but needs to be explicitly called.


## v1.0.0

The following changes were introduced with the v1.0.0 release:

 * Breaking Change: Config parameters need to be passed into the function call when requiring the middleware:

  ```javascript
  var middleware = require('botkit-middleware-watson')({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID
  });
  ```

 * Added `hears` function to middleware
