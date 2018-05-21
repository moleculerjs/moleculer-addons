"use strict";

let { ServiceBroker } 	= require("moleculer");
let SlackService 			= require("../../index");

/**
 * For testing:
 * ------------
 * 
 * Test credentials: https://www.twilio.com/console/voice/dev-tools/test-credentials
 * Test phone numbers: https://www.twilio.com/docs/api/rest/test-credentials#test-sms-messages-example-1
 */

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService({
	name: "slack",
	mixins: [SlackService],
	settings: {
		// Create Slack App, Enable incoming webhook, generate API token. Please read https://api.slack.com/slack-apps
		slackToken: "",
		slackChannel: ""
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
