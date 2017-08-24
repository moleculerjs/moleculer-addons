"use strict";

let { ServiceBroker } 	= require("moleculer");
let BeeService			= require("../../index");

let broker = new ServiceBroker({ logger: console });

broker.createService({
	name: "task-worker",
	mixins: [BeeService()],

	queues: {
		"sample.task"(job) {
			this.logger.info("New job received!", job.data);
			job.reportProgress(10);

			return new this.Promise(resolve => {
				setTimeout(() => resolve({
					done: true,
					id: job.data.id,
					worker: process.pid
				}), 500);
			});
		}
	}
});

broker.start();
