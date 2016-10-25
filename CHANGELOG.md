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
