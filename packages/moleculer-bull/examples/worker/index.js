"use strict";

let { ServiceBroker } 	= require("moleculer");
let BullService			= require("../../index");

let broker = new ServiceBroker({ logger: console });

broker.createService({
	mixins: [BullService()],

	queues: {
		"sample.task"(job) {
			this.logger.info("New job received!", job.data);

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
