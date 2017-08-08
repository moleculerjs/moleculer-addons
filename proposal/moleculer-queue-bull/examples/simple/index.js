"use strict";

let { ServiceBroker } 	= require("moleculer");
let BullService			= require("../../index");

let broker = new ServiceBroker({ logger: console });

broker.createService({
	mixins: [BullService()],

	started() {
		let id = 1;
		setInterval(() => {
			this.logger.info("Add a new job. ID: ", id);
			this.enqueue("sample.task", { id: id++, pid: process.pid });
		}, 2000);

		this.getQueue("sample.task").on("global:completed", (job, res) => {
			this.logger.info("Job completed!. Result:", res);
		});
	}
});

broker.start();
