"use strict";

let { ServiceBroker } 	= require("moleculer");
let SlackService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

require('dotenv').config()

// Load my service
broker.createService({
	name: "slack",
	mixins: [SlackService],
	settings: {
		// Create Slack App, Enable incoming webhook, generate API token. Please read https://api.slack.com/slack-apps
        slackToken: process.env.SLACK_TOKEN,
        slackChannel: process.env.SLACK_CHANNEL,
	}
});

// Start server
broker.start().then(() => {

	// Call action
	broker
		.call("slack.send", { message: "Hello Slack!" })
		.then(res => console.log("Res TS:", res.ts))
		.catch(console.error);

});
