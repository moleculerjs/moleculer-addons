"use strict";

let { ServiceBroker } 	= require("moleculer");
let SharedObj 			= require("../../index");

// Create broker #1
const broker1 = new ServiceBroker({
	namespace: "streaming",
	nodeID: "client-" + process.pid,
	transporter: "NATS",
	serializer: "JSON",
	logger: console,
	logLevel: "info"
});

// Create broker #2
const broker2 = new ServiceBroker({
	namespace: "streaming",
	nodeID: "encrypter-" + process.pid,
	transporter: "NATS",
	serializer: "JSON",
	logger: console,
	logLevel: "info"
});

broker1.createService({
	name: "posts",
	mixins: [SharedObj(["obj"])],
	started() {
		this.logger.info("Obj: ", this.obj);

		setTimeout(() => {
			this.obj.name = "John";
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
