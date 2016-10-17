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

var crypto = require('crypto');

/**
 * Verify the request came from Facebook using the approaches described here:
 * https://developers.facebook.com/docs/graph-api/webhooks
 */
module.exports = function verifyFacebookSignatureHeader(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    console.log("Signature absent in the request: %s", JSON.stringify(req));
  } else {
    // Get the facebook signature
    var elements = signature.split('sha1=');
    var facebookSignature = elements[1];

    var expectedSignature = crypto.createHmac('sha1', process.env.FB_APP_SECRET)
      .update(buf)
      .digest('hex');

    if (facebookSignature !== expectedSignature) {
      throw new Error("Could not verify message was sent from Facebook.");
    }
  }
}
