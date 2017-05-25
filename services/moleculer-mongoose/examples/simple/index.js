"use strict";

let { ServiceBroker } = require("moleculer");
let MongooseService = require("../../index");
let Post = require("../models/posts");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(MongooseService, {
	name: "posts",
	collection: Post,
	settings: {
		// Connection string
		db: "mongodb://localhost",

		propertyFilter: "title content votes",

		populates: {
			"author": "persons.model"
		}
	},

	afterConnected() {
		console.log("afterConnected: Connected successfully");
	}
});

// Start server
broker.start().delay(500).then(() => {
	let id;
	Promise.resolve()
		// Drop all posts
		.then(() => console.log("\n--- DROP ---"))
		.then(() => broker.call("posts.drop").then(console.log))

		// Count of posts
		.then(() => console.log("\n--- COUNT ---"))
		.then(() => broker.call("posts.count").then(console.log))
		
		// List posts
		.then(() => console.log("\n--- LIST ---"))
		.then(() => broker.call("posts.list").then(console.log))
		// Create new Posts
		.then(() => console.log("\n--- CREATE ---"))
		.then(() => broker.call("posts.create", { entity: { title: "Hello", content: "Post content" } })
			.then(doc => {
				id = doc._id;
				console.log("Saved: ", doc);
			})
		)
		// Get a post
		.then(() => console.log("\n--- GET ---"))
		.then(() => broker.call("posts.get", { id }).then(console.log))
		// Update a posts
		.then(() => console.log("\n--- UPDATE ---"))
		.then(() => broker.call("posts.update", { 
			id, 
			update: { 
				$set: { 
					title: "Hello 2", 
					content: "Post content 2" 
				} 
			} 
		}).then(console.log))
		
		// Count of posts
		.then(() => console.log("\n--- COUNT ---"))
		.then(() => broker.call("posts.count").then(console.log))
		
		// Remove a post
		.then(() => console.log("\n--- REMOVE ---"))
		.then(() => broker.call("posts.remove", { id }).then(console.log))

		// Count of posts
		.then(() => console.log("\n--- COUNT ---"))
		.then(() => broker.call("posts.count").then(console.log))

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());


});
