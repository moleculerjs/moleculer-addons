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
	collection: Post,
	settings: {
		fields: "_id title content votes author",

		populates: {
			"author": {
				action: "users.model",
				params: {
					fields: "username fullName"
				}
			}
		}
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
						this.adapter.findAll({}).then(res => console.log("Saved posts:", res ));
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
	collection: User,
	settings: {
		fields: "_id username fullName email"
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
					this.adapter.findAll({}).then(res => console.log("Saved users:", res ));
				});
			}
		});
	}
});

// Start server
broker.start().delay(3000).then(() => {
	Promise.resolve()
		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- FIND POSTS (search: 'ipsam') ---")))
		.then(() => broker.call("posts.find", { limit: 0, offset: 0, sort: "-votes title", search: "ipsam", populate: true, fields: ["title", "votes", "author"] }).then(console.log))
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT POSTS (search: 'ipsam') ---")))
		.then(() => broker.call("posts.count", { search: "ipsam" }).then(console.log))
		.then(() => console.log(chalk.yellow.bold("\n--- FIND POSTS (limit: 3, offset: 2, sort: title) ---")))
		.then(() => broker.call("posts.find", { limit: 3, offset: 2, sort: "title", fields: ["title", "votes"] }).then(console.log))

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());
});
