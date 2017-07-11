"use strict";

let { ServiceBroker } = require("moleculer");
let DbService = require("../../index");
let _ = require("lodash");
let chalk = require("chalk");
let path = require("path");
let fakerator = require("fakerator")();

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service

broker.createService(DbService, {
	name: "products",
	adapter: new DbService.MemoryAdapter(),
	settings: {
		fields: ["_id", "name"]
	},

	methods: {

		encodeID(id) {
			return "prod-" + id;
		},

		decodeID(id) {
			if (id.startsWith("prod-"))
				return id.slice(5);
		}

	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		return this.count().delay(500).then(count => {
			if (count == 0) {
				this.logger.info("Seed products...");
				let products = _.times(20, i => {
					return {
						name: "Product " + i
					};
				});
				return this.createMany(null, { entities: products })
					.then(() => this.adapter.count())
					.then(count => console.log("Saved products:", count ));

			}
		});		
	}
});

// Start server
broker.start().delay(1000).then(() => {
	let id;
	Promise.resolve()

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- FIND PRODUCTS ---")))
		.then(() => broker.call("products.find", { limit: 5 }).then(rows => {
			console.log(rows);
			id = rows[3]._id;
		}))

		// Get by encoded ID
		.then(() => console.log(chalk.yellow.bold("\n--- GET BY ID ---")))
		.then(() => broker.call("products.get", { id }).then(console.log))

		// Update a product
		.then(() => console.log(chalk.yellow.bold("\n--- UPDATE ---")))
		.then(() => broker.call("products.update", { 
			id, 
			update: { 
				$set: { 
					name: "Modified product"
				} 
			} 
		}).then(console.log))

		// Get a model
		.then(() => console.log(chalk.yellow.bold("\n--- MODEL ---")))
		.then(() => broker.call("products.model", { id }).then(console.log))

		// Remove by ID
		.then(() => console.log(chalk.yellow.bold("\n--- REMOVE BY ID ---")))
		.then(() => broker.call("products.remove", { id }).then(console.log))

		// Count of products
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT ---")))
		.then(() => broker.call("products.count").then(console.log))

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());
});
