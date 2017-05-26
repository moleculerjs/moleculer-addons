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
		db: "mongodb://localhost/moleculer-demo",

		propertyFilter: "_id title content votes",

		populates: {
			"author": "persons.model"
		}
	},

	actions: {
		vote(ctx) {
			return this.Promise.resolve(ctx)
					.then(ctx => {
						return this.collection.findByIdAndUpdate(ctx.params.id, { $inc: { votes: 1 } }, { "new": true });
					})
					.then(doc => this.toJSON(doc))
					.then(json => this.popuplateModels(ctx, json))
					.then(json => this.clearCache().then(() => json));			
		},

		unvote(ctx) {
			return this.Promise.resolve(ctx)
					.then(ctx => {
						return this.collection.findByIdAndUpdate(ctx.params.id, { $inc: { votes: -1 } }, { "new": true });
					})
					.then(doc => this.toJSON(doc))
					.then(json => this.popuplateModels(ctx, json))
					.then(json => this.clearCache().then(() => json));			
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
		
		// Create new Posts
		.then(() => console.log("\n--- CREATE ---"))
		.then(() => broker.call("posts.create", { entity: { title: "Hello", content: "Post content" } })
			.then(doc => {
				id = doc._id;
				console.log("Saved: ", doc);
			})
		)

		// List posts
		.then(() => console.log("\n--- LIST ---"))
		.then(() => broker.call("posts.list").then(console.log))

		// Get a post
		.then(() => console.log("\n--- GET ---"))
		.then(() => broker.call("posts.get", { id }).then(console.log))

		// Vote a post
		.then(() => console.log("\n--- VOTE ---"))
		.then(() => broker.call("posts.vote", { 
			id
		}).then(console.log))

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

		// Unvote a post
		.then(() => console.log("\n--- UNVOTE ---"))
		.then(() => broker.call("posts.unvote", { 
			id
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
