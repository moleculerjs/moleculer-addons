"use strict";

let { ServiceBroker } 	= require("moleculer");
let SharedObj 			= require("../../index");
const util = require("util");

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

broker1.createService({
	name: "posts",
	mixins: [SharedObj(["obj"])],
	started() {
		this.obj.user = {
			name: "John"
		};

		setTimeout(() => {
			this.obj.user.roles = ["admin"];
			this.obj.user.roles.push("member");
		}, 2000);
	}
});

broker2.createService({
	name: "users",
	mixins: [SharedObj(["obj"])],
	started() {
		this.logger.info("Obj: ", this.obj);
	}
});

broker1.Promise.all([broker1.start(), broker2.start()])
	.delay(2000)
	.then(() => broker1.repl());
