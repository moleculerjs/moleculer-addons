"use strict";

let { ServiceBroker } 	= require("moleculer");
let SharedObj 			= require("../../index");
const util = require("util");
const _ = require("lodash");

// Create broker #1
const broker1 = new ServiceBroker({
	namespace: "shared",
	nodeID: "first",
	transporter: "NATS",
	serializer: "JSON",
	logger: console,
	logLevel: "info",
	logObjectPrinter: o => util.inspect(o, { depth: 4, breakLength: 100 })
});

// Create broker #2
const broker2 = new ServiceBroker({
	namespace: "shared",
	nodeID: "second",
	transporter: "NATS",
	serializer: "JSON",
	logger: console,
	logLevel: "info",
	logObjectPrinter: o => util.inspect(o, { depth: 4, breakLength: 100 })
});

let origObj;

broker1.createService({
	name: "posts",
	mixins: [SharedObj(["obj"])],
	started() {
		setTimeout(() => {
			this.obj.user = {
				name: "John",
				age: 35
			};
			origObj = this.obj;
			this.obj.user.roles = ["admin", "moderator"];
		}, 1000);

		setTimeout(() => {
			this.obj.user.roles.push("member");
		}, 1500);

		setTimeout(() => {
			this.obj.user.name = "Jane";
			this.obj.user.roles[3] = "user";
		}, 2000);

		setTimeout(() => {
			delete this.obj.user.age;
			this.obj.user.roles.splice(1, 1);
			//this.obj.user.roles.shift();
		}, 2500);
	}
});

broker2.createService({
	name: "users",
	mixins: [SharedObj(["obj"])],
	started() {
		this.logger.info("Obj: ", this.obj);

		setTimeout(() => {
			this.logger.info("Final received", this.obj);
			this.logger.info("Equals:", _.isEqual(this.obj, origObj));
		}, 5000);
	}
});

broker1.Promise.all([broker1.start(), broker2.start()])
	.delay(2000)
	.then(() => broker1.repl());
