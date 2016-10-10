/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 * This code is mostly adapted from wit.ai's facebook bot example.
 *
 */

var crypto = require('crypto');

module.exports = function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];
  if (!signature) {
    console.log("Signature absent in the request: %s", JSON.stringify(req));
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];
    var expectedHash = crypto.createHmac('sha1', process.env.FB_APP_SECRET)
      .update(buf)
      .digest('hex');

    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}
