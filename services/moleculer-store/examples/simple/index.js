"use strict";

let { ServiceBroker } = require("moleculer");
let StoreService = require("../../index");
let StoreAdapterNeDB = require("../../src/adapter");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(StoreService, {
	name: "posts",
	adapter: new StoreAdapterNeDB(),
	settings: {
		propertyFilter: "_id title content votes"
	},

	actions: {
		vote(ctx) {
			return this.Promise.resolve(ctx)
				.then(ctx => this.adapter.updateById(ctx.params.id, { $inc: { votes: 1 } }))
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));		
		},

		unvote(ctx) {
			return this.Promise.resolve(ctx)
				.then(ctx => this.adapter.updateById(ctx.params.id, { $inc: { votes: -1 } }))
				.then(docs => this.transformDocuments(ctx, docs))
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
		.then(() => console.log("\n--- CLEAR ---"))
		.then(() => broker.call("posts.clear").then(console.log))

		// Count of posts
		.then(() => console.log("\n--- COUNT ---"))
		.then(() => broker.call("posts.count").then(console.log))
		
		// Create new Posts
		.then(() => console.log("\n--- CREATE ---"))
		.then(() => broker.call("posts.create", { entity: { title: "Hello", content: "Post content", votes: 0, createdAt: new Date(), updatedAt: null, author: null } })
			.then(doc => {
				id = doc._id;
				console.log("Saved: ", doc);
			})
		)

		// List posts
		.then(() => console.log("\n--- FIND ---"))
		.then(() => broker.call("posts.find").then(console.log))

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
					content: "Post content 2",
					updatedAt: new Date()
				} 
			} 
		}).then(console.log))

		// Get a post
		.then(() => console.log("\n--- GET ---"))
		.then(() => broker.call("posts.get", { id }).then(console.log))

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
