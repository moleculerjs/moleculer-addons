"use strict";

let { ServiceBroker } 	= require("moleculer");
let SmsService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService({
	name: "twilio",
	mixins: [SmsService],
	settings: {
		//accountSid: "",
		//authToken: "",
		phoneNumber: "+15005550006"
	}
});

// Start server
broker.start().then(() => {

	// Call action
	broker
		.call("twilio.send", { to: "+14108675309", message: "Hello Twilio!" })
		.then(sms => console.log("SMS Sid:", sms.sid))
		.catch(console.error);

});
