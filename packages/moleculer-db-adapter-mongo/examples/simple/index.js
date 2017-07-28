"use strict";

let _ = require("lodash");
let chalk = require("chalk");
let { ServiceBroker } = require("moleculer");
let StoreService = require("../../../moleculer-db/index");
let MongoAdapter = require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});
const adapter = new MongoAdapter("mongodb://localhost/moleculer-db-demo");

// Load my service
const service = broker.createService(StoreService, {
	name: "posts",
	adapter,
	collection: "posts",
	settings: {},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
		return this.clear().then(() => {
			this.adapter.collection.createIndex( { title: "text", content: "text" } );
		});
	}
});

function header(text) {
	console.log();
	console.log(chalk.yellow.bold(`--- ${text} ---`));
}

let ok = 0;
let fail = 0;
function printValid(cond) {
	let res = cond;
	if (_.isFunction(cond))
		res = cond();

	if (res) {
		console.log(chalk.bgGreen.yellow.bold("+++ OK +++"));
		ok++;
	} else {
		console.log(chalk.bgRed.yellow.bold("--- FAIL ---"));
		fail++;
	}
	//console.log("");
}

function printTotal() {
	console.log();
	console.log(chalk.bgGreen.yellow.bold(`+++ OK: ${ok} +++`), fail > 0 ? " | " + chalk.bgRed.yellow.bold(`--- FAIL: ${fail} ---`) : "");
	console.log();
}

function execTest(title, fn, cb) {
	return () => Promise.resolve(header(title)).then(() => fn()).then(cb);
}

const tests = [

];

// Start server
broker.start().delay(500).then(() => {
	let ids =[];
	let date = new Date();

	Promise.resolve()
		// Count of posts
		.then(execTest("COUNT", () => adapter.count(), res => {
			console.log(res);
			printValid(res == 0);
		}))
		
		// Insert a new Post
		.then(() => header("INSERT"))
		.then(() => adapter.insert({ title: "Hello", content: "Post content", votes: 3, status: true, createdAt: date })
			.then(doc => {
				ids[0] = doc._id.toHexString();
				console.log("Saved: ", doc);
				printValid(doc._id && doc.title === "Hello" && doc.content === "Post content" && doc.votes === 3 && doc.status === true && doc.createdAt === date);
			})
		)

		// Find
		.then(() => header("FIND"))
		.then(() => adapter.find({}).then(res => {
			console.log(res);
			printValid(res.length == 1 && res[0]._id.toHexString() == ids[0]);
		}))

		// Find by ID
		.then(() => header("GET"))
		.then(() => adapter.findById(ids[0]).then(res => {
			console.log(res);
			printValid(res._id.toHexString() == ids[0]);
		}))

		// Count of posts
		.then(() => header("COUNT"))
		.then(() => adapter.count().then(res => {
			console.log(res);
			printValid(res == 1);
		}))

		// Insert many new Posts
		.then(() => header("INSERT MANY"))
		.then(() => adapter.insertMany([
			{ title: "Second", content: "Second post content", votes: 8, status: true, createdAt: new Date() },
			{ title: "Last", content: "Last document", votes: 1, status: false, createdAt: new Date() }
		]).then(docs => {
			console.log("Saved: ", docs);
			printValid(docs.length == 2);
			ids[1] = docs[0]._id.toHexString();
			ids[2] = docs[1]._id.toHexString();

			printValid(ids[1] && docs[0].title === "Second" && docs[0].votes === 8);
			printValid(ids[1] && docs[1].title === "Last" && docs[1].votes === 1 && docs[1].status === false);
		}))

		// Count of posts
		.then(() => header("COUNT"))
		.then(() => adapter.count().then(res => {
			console.log(res);
			printValid(res == 3);
		}))		

		// Find
		.then(() => header("FIND by query"))
		.then(() => adapter.find({ query: { title: "Last" } }).then(res => {
			console.log(res);
			printValid(res.length == 1 && res[0]._id.toHexString() == ids[2]);
		}))

		// Find
		.then(() => header("FIND by limit, sort, query"))
		.then(() => adapter.find({ limit: 1, sort: ["votes", "-title"], offset: 1 }).then(res => {
			console.log(res);
			printValid(res.length == 1 && res[0]._id.toHexString() == ids[0]);
		}))

		// Find
		.then(() => header("FIND by query ($gt)"))
		.then(() => adapter.find({ query: { votes: { $gt: 2 } } }).then(res => {
			console.log(res);
			printValid(res.length == 2);
		}))

		// Find
		.then(() => header("COUNT by query ($gt)"))
		.then(() => adapter.count({ query: { votes: { $gt: 2 } } }).then(res => {
			console.log(res);
			printValid(res == 2);
		}))

		// Find
		.then(() => header("FIND by text search"))
		.then(() => adapter.find({ search: "content" }).then(res => {
			console.log(res);
			printValid(res.length == 2);
			printValid(res[0]._score < 1 && res[0].title === "Hello");
			printValid(res[1]._score < 1 && res[1].title === "Second");
		}))

		
		// Find by IDs
		.then(() => header("GET BY IDS"))
		.then(() => adapter.findByIds([ids[2], ids[0]]).then(res => {
			console.log(res);
			printValid(res.length == 2);
		}))

		// Update a posts
		.then(() => header("UPDATE"))
		.then(() => adapter.updateById(ids[2], { $set: { 
			title: "Last 2", 
			updatedAt: new Date(),
			status: true
		}}).then(doc => {
			console.log("Updated: ", doc);
			printValid(doc._id && doc.title === "Last 2" && doc.content === "Last document" && doc.votes === 1 && doc.status === true && doc.updatedAt);
		}))

		// Update by query
		.then(() => header("UPDATE BY QUERY"))
		.then(() => adapter.updateMany({ votes: { $lt: 5 }}, { 
			$set: { status: false }
		}).then(count => {
			console.log("Updated: ", count);
			printValid(count == 2);
		}))

		// Remove by query
		.then(() => header("REMOVE BY QUERY"))
		.then(() => adapter.removeMany({ votes: { $lt: 5 }}).then(count => {
			console.log("Removed: ", count);
			printValid(count == 2);
		}))

		// Count of posts
		.then(() => header("COUNT"))
		.then(() => adapter.count().then(res => {
			console.log(res);
			printValid(res == 1);
		}))	

		// Remove by ID
		.then(() => header("REMOVE BY ID"))
		.then(() => adapter.removeById(ids[1]).then(doc => {
			console.log("Removed: ", doc);
			printValid(doc && doc._id.toHexString() == ids[1]);
		}))

		// Count of posts
		.then(() => header("COUNT"))
		.then(() => adapter.count().then(res => {
			console.log(res);
			printValid(res == 0);
		}))	

		// Clear
		.then(() => header("CLEAR"))
		.then(() => adapter.clear().then(res => {
			console.log(res);
			printValid(res == 0);
		}))	

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop())

		.then(() => printTotal());

});
