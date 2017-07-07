"use strict";

let _ = require("lodash");
let chalk = require("chalk");
let { ServiceBroker } = require("moleculer");
let DbService = require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(DbService, {
	name: "posts",
	settings: {
		fields: "title"
	},

	methods: {
		seedDB() {
			return this.createMany(null, { entities: _.times(28, i => {
				return {
					title: `Post #${_.padStart(i + 1, 2, "0")}`
				};
			})});
		}
	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		this.clear();

		this.seedDB();
	}
});

// Start server
broker.start().delay(500).then(() => {
	let id;
	Promise.resolve()
		// Count of posts
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT ---")))
		.then(() => broker.call("posts.count").then(console.log))
		
		// Find posts
		.then(() => console.log(chalk.yellow.bold("\n--- FIND ---")))
		.then(() => broker.call("posts.find", { sort: "title" }).then(console.log))

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- LIST FIRST 10 ---")))
		.then(() => broker.call("posts.list", { sort: "title" }).then(console.log))

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- LIST LAST 10 ---")))
		.then(() => broker.call("posts.list", { sort: "-title" }).then(console.log))

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- LIST FIRST 25 ---")))
		.then(() => broker.call("posts.list", { page: 1, pageSize: 25, sort: "title" }).then(console.log))

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- LIST NEXT 25 ---")))
		.then(() => broker.call("posts.list", { page: 2, pageSize: 25, sort: "title" }).then(console.log))

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- LIST NEXT2 25 ---")))
		.then(() => broker.call("posts.list", { page: 3, pageSize: 25, sort: "title" }).then(console.log))

		// List posts with search
		.then(() => console.log(chalk.yellow.bold("\n--- LIST SEARCH 5 ---")))
		.then(() => broker.call("posts.list", { page: 1, pageSize: 5, search: "#2" }).then(console.log))


		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());


});
