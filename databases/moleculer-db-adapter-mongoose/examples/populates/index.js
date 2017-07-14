"use strict";

let { ServiceBroker } = require("moleculer");
let StoreService = require("../../../moleculer-db/index");
let MongooseAdapter = require("../../index");
let Post = require("../models/posts");
let User = require("../models/users");

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
broker.createService(StoreService, {
	name: "posts",
	adapter: new MongooseAdapter("mongodb://localhost/moleculer-db-demo"),
	model: Post,
	settings: {
		fields: ["_id", "title", "content", "votes", "author"],

		populates: {
			"author": {
				action: "users.get",
				params: {
					fields: ["username", "fullName"]
				}
			}
		}
	},

	actions: {
		vote(ctx) {
			return this.Promise.resolve(ctx)
				.then(ctx => this.update(ctx, { id: ctx.params.id, update: { $inc: { votes: 1 } }}));
		},

		unvote(ctx) {
			return this.Promise.resolve(ctx)
				.then(ctx => this.update(ctx, { id: ctx.params.id, update: { $inc: { votes: -1 } }}));		
		}
	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		return this.count().delay(2000).then(count => {
			if (count == 0) {
				this.logger.info("Seed Posts collection...");
				return broker.call("users.find").then(users => {
					if (users.length == 0) return;
					//console.log(users);
					// Create fake posts
					return Promise.all(_.times(10, () => {
						let fakePost = fakerator.entity.post();
						return this.adapter.insert({
							title: fakePost.title,
							content: fakePost.content,
							author: fakerator.random.arrayElement(users)._id,
							votes: fakerator.random.number(10)
						});
					})).then(() => {
						this.adapter.find({}).then(res => console.log("Saved posts:", res ));
					});

				});
			}
		});		
	}
});

// Load my service
broker.createService(StoreService, {
	name: "users",
	adapter: new MongooseAdapter("mongodb://localhost/moleculer-db-demo"),
	model: User,
	settings: {
		fields: ["_id", "username", "fullName", "email"]
	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		return this.count().then(count => {
			if (count == 0) {
				this.logger.info("Seed Users collection...");
				// Create fake users
				return Promise.all(_.times(10, () => {
					let fakeUser = fakerator.entity.user();
					return this.adapter.insert({
						username: fakeUser.userName,
						fullName: fakeUser.firstName + " " + fakeUser.lastName,
						email: fakeUser.email
					});
				})).then(() => {
					this.adapter.find({}).then(res => console.log("Saved users:", res ));
				});
			}
		});
	}
});

let postID;
// Start server
broker.start().delay(3000).then(() => {
	Promise.resolve()
		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- FIND POSTS (search: 'ipsam') ---")))
		.then(() => broker.call("posts.find", { limit: 0, offset: 0, sort: "-votes title", search: "ipsam", populate: ["author"], fields: ["_id", "title", "votes", "author"] }).then(posts => {
			postID = posts[0]._id;
			console.log(posts);
		}))
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT POSTS (search: 'ipsam') ---")))
		.then(() => broker.call("posts.count", { search: "ipsam" }).then(console.log))
		.then(() => console.log(chalk.yellow.bold("\n--- FIND POSTS (limit: 3, offset: 2, sort: title, no author) ---")))
		.then(() => broker.call("posts.find", { limit: 3, offset: 2, sort: "title", fields: ["title", "votes"] }).then(console.log))
		.then(() => console.log(chalk.yellow.bold("\n--- GET POST (page: 2, pageSize: 5, sort: -votes) ---")))
		.then(() => broker.call("posts.get", { id: postID, populate: ["author"], fields: ["title", "author"] }).then(console.log))
		.then(() => console.log(chalk.yellow.bold("\n--- LIST POSTS (page: 2, pageSize: 5, sort: -votes) ---")))
		.then(() => broker.call("posts.list", { page: 2, pageSize: 5, sort: "-votes", populate: ["author"], fields: ["_id", "title", "votes", "author"] }).then(console.log))

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());
});
