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
