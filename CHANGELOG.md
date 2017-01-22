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


## Changes in v1.0.0

The following changes were introduced with the v1.0.0 release:

 * Breaking Change: Config parameters need to be passed into the function call when requiring the middleware:

  ```javascript
  var middleware = require('botkit-middleware-watson')({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID
  });
  ```

 * Added hears function to middleware
