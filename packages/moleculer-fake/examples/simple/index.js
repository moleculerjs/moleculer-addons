"use strict";

let { ServiceBroker } 	= require("moleculer");
let MyService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console
});

// Load my service
broker.createService(MyService);

// Start server
broker.start().then(() => {

	// Call action
	broker
		.call("fake.generate", { _type: "random.number", times: 1 })
		.then(res => broker.logger.info("Result", res))
		.catch(err => broker.logger.error("Error:", err));

});
