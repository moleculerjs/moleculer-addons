"use strict";

let { ServiceBroker } 	= require("moleculer");
let MongooseService		= require("../../index");
let Post				= require("../models/posts");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(MongooseService, {
	name: "posts",
	settings: {
		db: "mongo://localhost",
		collection: Post
	}
});

// Start server
broker.start().then(() => {

	Promise.resolve()
		// Drop all posts
		.then(() => broker.call("posts.drop").then(console.log))
		// List posts
		.then(() => broker.call("posts.list").then(console.log))
		// Create new Posts
		.then(() => broker.call("posts.create").then(console.log))
		// Get a post
		.then(() => broker.call("posts.get").then(console.log))
		// Update a posts
		.then(() => broker.call("posts.update").then(console.log))
		// Remove a post
		.then(() => broker.call("posts.remove").then(console.log))

		// Error handling
		.catch(console.error);

});
