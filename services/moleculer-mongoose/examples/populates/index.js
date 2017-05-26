"use strict";

let { ServiceBroker } = require("moleculer");
let MongooseService = require("../../index");
let Post = require("../models/posts");
let User = require("../models/users");
let _ = require("lodash");
let fakerator = require("fakerator")();

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

		propertyFilter: "_id title content votes author",

		populates: {
			"author": "users.model"
		}
	},

	actions: {
		vote(ctx) {
			return this.Promise.resolve(ctx)
					.then(ctx => this.collection.findByIdAndUpdate(ctx.params.id, { $inc: { votes: 1 } }, { "new": true }))
					.then(docs => this.transformDocuments(ctx, docs))
					.then(json => this.clearCache().then(() => json));		
		},

		unvote(ctx) {
			return this.Promise.resolve(ctx)
					.then(ctx => this.collection.findByIdAndUpdate(ctx.params.id, { $inc: { votes: -1 } }, { "new": true }))
					.then(docs => this.transformDocuments(ctx, docs))
					.then(json => this.clearCache().then(() => json));		
		}
	},

	afterConnected() {
		console.log("afterConnected: Connected successfully");
		this.count().then(count => {
			if (count == 0) {
				this.logger.info("Seed Posts collection...");
				broker.call("users.find").then(users => {
					if (users.length == 0) return;
					//console.log(users);
					// Create fake users
					return Promise.all(_.times(10, () => {
						let fakePost = fakerator.entity.post();
						let post = new Post({
							title: fakePost.title,
							content: fakePost.content,
							author: fakerator.random.arrayElement(users)._id
						});
						return post.save();
					}));

				});
			}
		});		
	}
});

// Load my service
broker.createService(MongooseService, {
	name: "users",
	collection: User,
	settings: {
		// Connection string
		db: "mongodb://localhost/moleculer-demo",
		propertyFilter: "_id username fullName"
	},

	afterConnected() {
		console.log("afterConnected: Connected successfully");
		this.count().then(count => {
			if (count == 0) {
				this.logger.info("Seed Users collection...");
				// Create fake users
				return Promise.all(_.times(10, () => {
					let fakeUser = fakerator.entity.user();
					let user = new User({
						username: fakeUser.userName,
						fullName: fakeUser.firstName + " " + fakeUser.lastName,
						email: fakeUser.email
					});
					return user.save();
				}));
			}
		});
	}
});

// Start server
broker.start().delay(500).then(() => {
	let id;
	Promise.resolve()
		// List posts
		.then(() => console.log("\n--- FIND POSTS ---"))
		.then(() => broker.call("posts.find").then(console.log))

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());

});
