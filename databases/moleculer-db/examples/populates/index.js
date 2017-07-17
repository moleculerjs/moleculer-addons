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
	name: "posts",
	adapter: new DbService.MemoryAdapter({ filename: path.join(__dirname, "posts.db") }),
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

	methods: {

		encodeID(id) {
			return "post-" + id;
		},

		decodeID(id) {
			if (id.startsWith("post-"))
				return id.slice(5);
		}

	},

	actions: {
		vote(ctx) {
			return this.updateById(ctx, { id: ctx.params.id, update: { $inc: { votes: 1 } }});
		},

		unvote(ctx) {
			return this.updateById(ctx, { id: ctx.params.id, update: { $inc: { votes: -1 } }});		
		}
	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		return this.count().delay(500).then(count => {
			if (count == 0) {
				this.logger.info("Seed Posts collection...");
				return broker.call("users.find").then(users => {
					if (users.length == 0) return;
					//console.log(users);
					// Create fake posts
					let posts = _.times(10, () => {
						let fakePost = fakerator.entity.post();
						return {
							title: fakePost.title,
							content: fakePost.content,
							author: fakerator.random.arrayElement(users)._id,
							votes: fakerator.random.number(10), 
							createdAt: new Date(), 
							updatedAt: null
						};
					});
					return this.createMany(null, { entities: posts })
						.then(() => this.adapter.count())
						.then(count => console.log("Saved posts:", count ));

				});
			}
		});		
	}
});

// Load my service
broker.createService(DbService, {
	name: "users",
	adapter: new DbService.MemoryAdapter({ filename: path.join(__dirname, "users.db") }),
	settings: {
		fields: ["_id", "username", "fullName", "email"]
	},

	methods: {

		encodeID(id) {
			return "user-" + id;
		},

		decodeID(id) {
			if (id.startsWith("user-"))
				return id.slice(5);
		}

	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		return this.count().then(count => {
			if (count == 0) {
				this.logger.info("Seed Users collection...");
				// Create fake users
				let users = _.times(10, () => {
					let fakeUser = fakerator.entity.user();
					return {
						username: fakeUser.userName,
						fullName: fakeUser.firstName + " " + fakeUser.lastName,
						email: fakeUser.email,
						createdAt: new Date(), 
						updatedAt: null
					};
				});
				return this.createMany(null, { entities: users })
					.then(() => this.adapter.count())
					.then(count => console.log("Saved users:", count ));

			}
		});
	}
});

let postID;
// Start server
broker.start().delay(1000).then(() => {
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
