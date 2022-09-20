"use strict";

const { ServiceBroker } = require("moleculer");
const PsqlQueueService = require("../../index");

const broker = new ServiceBroker({ logger: console });

broker.createService({
	name: "pub",

	mixins: [
		PsqlQueueService(
			"postgres://postgres:postgres@localhost:5444/task_queue"
		),
	],

	/**
	 * Service started lifecycle event handler
	 * @this {import('moleculer').Service}
	 */
	async started() {
		try {
			/**
			 * @param {String} name Task name
			 * @param {Object} payload Payload to pass to the task
			 * @param {import('graphile-worker').TaskSpec?} opts
			 */
			await this.createJob("sample.task", {
				id: 1,
				name: "simple.task",
			});
		} catch (error) {
			this.logger.error('Error creating "sample.task" job', error);
		}

		try {
			/**
			 * @param {String} name Task name
			 * @param {Object} payload Payload to pass to the task
			 * @param {import('graphile-worker').TaskSpec?} opts
			 */
			await this.createJob("another.task", {
				id: 2,
				name: "another.task",
			});
		} catch (error) {
			this.logger.error('Error creating "another.task" job', error);
		}
	},
});

broker.createService({
	name: "task-worker",

	mixins: [
		PsqlQueueService(
			"postgres://postgres:postgres@localhost:5444/task_queue"
		),
	],

	settings: {
		/**
		 * @type {Record<String, Function>}
		 * For a complete list of events see: https://github.com/graphile/worker#workerevents
		 */
		jobEventHandlers: {
			/**
			 * @param {{
			 *  worker: import('graphile-worker').Worker,
			 *  job: import('graphile-worker').Job
			 * }}
			 * @this {import('moleculer').Service}
			 */
			"job:success": function ({ worker, job }) {
				this.logger.info(
					`Worker ${worker.workerId} completed job ${job.id}`
				);
			},
		},
	},

	queues: {
		/**
		 * @param {Object} payload Message payload
		 * @param {import('graphile-worker').JobHelpers} helpers Postgres helpers
		 * More info about helpers: https://github.com/graphile/worker#creating-task-executors
		 */
		"sample.task"(payload, helpers) {
			// if (Math.random() > 0.5) {
			this.logger.info('New "simple.task" received!', payload);
			return;
			// } else {
			//	throw new Error('Random "sample.task" error');
			// }
		},

		"another.task": {
			/**
			 * @param {Object} payload Message payload
			 * @param {import('graphile-worker').JobHelpers} helpers Postgres helpers
			 * More info about helpers: https://github.com/graphile/worker#creating-task-executors
			 */
			process(payload, helpers) {
				this.logger.info('New "another.task" job received!', payload);
			},
		},
	},
});

broker.start();
