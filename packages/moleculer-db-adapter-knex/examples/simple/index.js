"use strict";

let { ServiceBroker } 	= require("moleculer");
let MyService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService({
	name: "knex",
	mixins: [MyService],
	settings: {
		
	}
});

// Start server
broker.start().then(() => {

	// Call action
	broker
		.call("knex.test", { name: "John Doe" })
		.then(console.log)
		.catch(console.error);

});
