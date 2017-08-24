"use strict";

let { ServiceBroker } 	= require("moleculer");
let BeeService			= require("../../index");

let broker = new ServiceBroker({ logger: console });

broker.createService({
	name: "pub",
	mixins: [BeeService()],

	started() {
		let id = 1;
		setInterval(() => {
			this.logger.info("Add a new job. ID: ", id);
			const job = this.createJob("sample.task", { id: id++, pid: process.pid });

			job.on("progress", progress => {
				this.logger.info(`Job #${job.id} progress is ${progress}%`);
			});

			job.on("succeeded", res => {
				this.logger.info(`Job #${job.id} completed!. Result:`, res);
			});

			job.save();

		}, 2000);
	}
});

broker.start();
