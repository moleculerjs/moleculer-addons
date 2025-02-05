"use strict";

const { ServiceBroker } = require("moleculer");
const PsqlQueueService = require("../../index");

const broker = new ServiceBroker({ logger: console });

broker.createService({
	name: "pub",

	mixins: [
		PsqlQueueService(
			"postgres://postgres:postgres@localhost:5444/task_queue",
			{
				// Name of the property in service schema.
				schemaProperty: "queues",
				// Name of the method in Service to create jobs
				createJobMethodName: "createJob",
				// Name of the property in Service to produce jobs
				producerPropertyName: "$producer",
				// Name of the property in Service to consume jobs
				consumerPropertyName: "$consumer",
				// Name of the internal queue that's used to store the job handlers
				internalQueueName: "$queue",
				// Name of the property in Service settings to register job event handlers
				jobEventHandlersSettingsProperty: "jobEventHandlers",

				// Optional producer configs: More info: https://github.com/graphile/worker#workerutilsoptions
				producerOpts: {},
				// Optional worker configs. More info: https://github.com/graphile/worker#runneroptions
				queueOpts: {
					concurrency: 5,
					// Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
					noHandleSignals: false,
					pollInterval: 1000,
				},
			}
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

	methods: {
		/**
		 * Replaces Default logger with Moleculer logger
		 * More info: https://github.com/graphile/worker#logger
		 */
		initLogger() {
			/**
			 * @param {String} level Log level
			 * @param {String} message Message to log
			 * @param {Object} meta  Additional metadata
			 */
			return (level, message, meta) => {
				this.$loggerQueue[level](message);
			};
		},
	},

	queues: {
		/**
		 * @param {Object} payload Message payload
		 * @param {import('graphile-worker').JobHelpers} helpers graphile-worker helpers
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
			 * @param {import('graphile-worker').JobHelpers} helpers graphile-worker helpers
			 * More info about helpers: https://github.com/graphile/worker#creating-task-executors
			 */
			process(payload, helpers) {
				this.logger.info('New "another.task" job received!', payload);
			},
		},
	},
});

broker
	.start()
	.then(() => {
		broker.repl();
	})
	.catch((error) => {
		broker.logger.error(error);
		process.exit(1);
	});
