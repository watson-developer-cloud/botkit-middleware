# Multi-channel bot

This document describes how to set up a sample Express app which talks to Slack, Facebook, and Twilio bots.

## Install all dependencies:

    ```
    npm install
    ```

## Getting credentials

### Watson Assistant

1. Sign up for an [IBM Cloud account](https://console.bluemix.net/registration/).
1. Download the [IBM Cloud CLI](https://console.bluemix.net/docs/cli/index.html#overview).
1. Create an instance of the Watson Assistant service and get your credentials:
    - Go to the [Watson Assistant](https://console.bluemix.net/catalog/services/conversation) page in the IBM Cloud Catalog.
    - Log in to your IBM Cloud account.
    - Click **Create**.
    - Click **Show** to view the service credentials.
    - Copy the `apikey` value, or copy the `username` and `password` values if your service instance doesn't provide an `apikey`.
    - Copy the `url` value.

1. Create a workspace using the Watson Assistant service and copy the `workspace_id`.

1. Open the *.env* file and add the service credentials that you obtained in the previous step.

    Example *.env* file that configures the `apikey` and `url` for a Watson Assistant service instance hosted in the US East region:

    ```
    ASSISTANT_IAM_APIKEY=X4rbi8vwZmKpXfowaS3GAsA7vdy17Qh7km5D6EzKLHL2
    ASSISTANT_URL=https://gateway-wdc.watsonplatform.net/assistant/api
    ```

    - If your service instance uses `username` and `password` credentials, add the `ASSISTANT_USERNAME` and `ASSISTANT_PASSWORD` variables to the *.env* file.

    Example *.env* file that configures the `username`, `password`, and `url` for a Watson Assistant service instance hosted in the US South region:

    ```
    ASSISTANT_USERNAME=522be-7b41-ab44-dec3-g1eab2ha73c6
    ASSISTANT_PASSWORD=A4Z5BdGENrwu8
    ASSISTANT_URL=https://gateway.watsonplatform.net/assistant/api
    ```

1. Add the `WORKSPACE_ID` to the previous properties

    ```
    WORKSPACE_ID=522be-7b41-ab44-dec3-g1eab2ha73c6
    ```


### Slack
Follow the Getting Started section of this [document](https://github.com/howdyai/botkit/blob/master/docs/readme-slack.md) from Botkit.
Once you obtain the Slack token, paste the token in the `.env` file.
```
SLACK_TOKEN=<your token>
```

### Facebook Messenger
Follow the Getting Started section of this [document](https://github.com/howdyai/botkit/blob/master/docs/readme-facebook.md) from Botkit.

*Some helpful hints for Facebook Messenger:*
 * Log into the Facebook App settings page. You need to add two Products- Messenger and Webhooks.
 * When setting up Messenger, make sure you have subscribed your page with your app, otherwise your app won't send back responses to your page. This step is also important cause Facebook will provide you with the _FB_ACCESS_TOKEN_ your bot will need to communicate via Messenger.
 * When setting up the webhook,
    * You'll have to first set up [localtunnel](https://localtunnel.github.io/www/) locally and start it on the same port where you plan to run your Express app. Let's say you run your app on port 5000, then in one terminal window run the following command:
    ```lt --port 5000```
  lt will provide you with a url, part of which will be the webhook url.
    * Add (`https://<your localtunnel url>/facebook/receive`) as Facebook Messenger's webhook. The webhook url must contain _https://_.
    eg:  If your localtunnel url is `http://litjqjglwn.localtunnel.me` your webhook url will be `https://litjqjglwn.localtunnel.me/facebook/receive`, otherwise Facebook will show an error.
    * You need to only subscribe to _Messages_ event under Webhooks.

Once you obtain the access token (provided by Facebook), the verify token (created by you) and the app secret key for your Facebook app (provided by Facebook), paste them in the .env file of your project.
```
FB_ACCESS_TOKEN=<your access token>
FB_VERIFY_TOKEN=<your verify token>
FB_APP_SECRET=<your apps secret key>
```

When you're ready to test your bot, go to your Facebook homepage and find the page you created. Click on _Message_ to start chatting with your Watson Assistant bot!

### Twilio IPM
Follow the Getting Started section of this [document](https://github.com/howdyai/botkit/blob/master/docs/readme-twilioipm.md) from Botkit.
Copy and paste all the authentication details in the `.env` file.
```
TWILIO_ACCOUNT_SID=<your account sid>
TWILIO_AUTH_TOKEN=<your auth token>
TWILIO_IPM_SERVICE_SID=<your service sid>
TWILIO_API_KEY=<your twilio API key>
TWILIO_API_SECRET=<your twilio API secret>
```
You'll need to set up [localtunnel](https://localtunnel.github.io/www/) and have it running on the same port as your app server. The webhook url for Twilio will then be (`https://<your localtunnel url>/twilio/receive`).

To test the bot, use this simple [Twilio IPM server](https://github.com/twilio/ip-messaging-demo-js).

## Starting the server

If you are connecting to a channel, you need to add `USE_<channel_name>` in the .env file.
 eg: If you would like to use Slack and Facebook Messenger, you must add the following lines in your .env file:
```
USE_SLACK=any_value
USE_FACEBOOK=any_value
```
The value of these variables doesn't matter, as long as they're present. The middleware knows it needs to connect to these channels.

Once you have added your credentials in the `.env` file, start the example express app by running this command:
```
node server.js
```

Voila! You're all set! Start chatting on your social channel to test your bot.
