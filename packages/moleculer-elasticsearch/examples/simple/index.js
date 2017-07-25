"use strict";

let { ServiceBroker } 	= require("moleculer");
let chalk 				= require("chalk");
let ESService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService({
	mixins: [ESService],
	settings: {
		elasticsearch: {
			host: "http://elastic:changeme@192.168.0.181:9200"
		}
	}
});

// Start server
broker.start()

	// Create a document
	.then(() => console.log(chalk.yellow.bold("\n--- CREATE JOHN ---")))
	.then(() => broker.call("elasticsearch.create", { index: "demo", type: "default", id: "1", body: { name: "John Doe", age: 36 } }).then(console.log))

	// Create a document
	.then(() => console.log(chalk.yellow.bold("\n--- CREATE JANE ---")))
	.then(() => broker.call("elasticsearch.create", { index: "demo", type: "default", id: "2", body: { name: "Jane Doe", age: 28 } }).then(console.log))

	// Update a document
	.then(() => console.log(chalk.yellow.bold("\n--- UPDATE JANE ---")))
	.then(() => broker.call("elasticsearch.update", { index: "demo", type: "default", id: "2", body: { doc: { age: 32 } } }).then(console.log))
	
	.delay(1000)

	// Get a document by ID
	.then(() => console.log(chalk.yellow.bold("\n--- GET JANE ---")))
	.then(() => broker.call("elasticsearch.get", { index: "demo", type: "default", id: "2" }).then(console.log))
	
	// Search with 'q'
	.then(() => console.log(chalk.yellow.bold("\n--- SEARCH Q ---")))
	.then(() => broker.call("elasticsearch.search", { q: 'name:"*doe"' }).then(res => { console.log(res); console.log(chalk.yellow.bold("\nHits:\n"), res.hits.hits); }))
	
	// Search with query
	.then(() => console.log(chalk.yellow.bold("\n--- SEARCH QUERY ---")))
	.then(() => broker.call("elasticsearch.search", { body: {
		query: {
			match: {
				name: "john"
			}
		}
	} }).then(res => { console.log(res); console.log(chalk.yellow.bold("\nHits:\n"), res.hits.hits); }))
	
	// Count with 'q'
	.then(() => console.log(chalk.yellow.bold("\n--- COUNT Q ---")))
	.then(() => broker.call("elasticsearch.count", { q: 'name:"*doe"' }).then(console.log))

	.catch(console.error)

	// Remove documents
	.then(() => console.log(chalk.yellow.bold("\n--- DROP ---")))
	.then(() => broker.call("elasticsearch.delete", { index: "demo", type: "default", id: "1" }).then(console.log))
	.then(() => broker.call("elasticsearch.delete", { index: "demo", type: "default", id: "2" }).then(console.log))
	
	.catch(console.error);
