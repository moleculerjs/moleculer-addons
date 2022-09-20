/*
 * moleculer-psql-queue
 * Copyright (c) 2022 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const { run, quickAddJob, makeWorkerUtils } = require("graphile-worker");

/**
 *
 * @param {String} url Connection String
 * @param {import('graphile-worker').RunnerOptions} queueOpts Queue options
 * @param {import('graphile-worker').WorkerUtilsOptions} producerOpts
 * @returns {import('moleculer').ServiceSchema}
 */
module.exports = function createService(
	url,
	queueOpts = {
		concurrency: 5,
		// Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
		noHandleSignals: false,
		pollInterval: 1000,
	},
	producerOpts = {}
) {
	/** @type {import('moleculer').ServiceSchema} */
	return {
		name: "psql-queue",

		settings: {
			jobEventHandlers: {
				/**
				 * @param {{
				 *  worker: import('graphile-worker').Worker,
				 *  job: import('graphile-worker').Job
				 * }}
				 * @this {import('moleculer').Service}
				 */
				success: function ({ worker, job }) {
					this.logger.info(
						`Worker ${worker.workerId} completed job ${job.id}`
					);
				},
			},
		},

		methods: {
			/**
			 * Creates a new task
			 * @param {String} name Task name
			 * @param {Object} payload Payload to pass to the task
			 * @param {import('graphile-worker').TaskSpec?} opts
			 */
			createJob(name, payload, opts) {
				return this.producer.addJob(name, payload, opts);
			},

			/**
			 *
			 * @param {String} name Task name
			 * @param {Object} payload Payload to pass to the task
			 * @param {import('graphile-worker').TaskSpec?} opts
			 */
			createQuickJob(name, payload, opts) {
				return quickAddJob(
					{ connectionString: url, ...opts },
					name,
					payload
				);
			},
		},

		/**
		 * Service created lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		created() {},

		/**
		 * Service started lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		async started() {
			try {
				this.producer = await makeWorkerUtils({
					connectionString: url,
					...producerOpts,
				});

				const taskList = {};

				if (!this.schema.queues) return;

				_.forIn(this.schema.queues, (fn, name) => {
					if (typeof fn === "function")
						taskList[name] = fn.bind(this);
					else {
						taskList[name] = fn.process.bind(this);
					}
				});

				// Run a worker to execute jobs:
				this.consumer = await run({
					connectionString: url,
					taskList: taskList,
					// Other opts
					...queueOpts,
				});

				this.consumer.events.on(
					"job:success",
					this.settings.jobEventHandlers.success.bind(this)
				);

				// If the worker exits (whether through fatal error or otherwise),
				// this promise will resolve/reject:
				await this.consumer.promise;
			} catch (error) {
				this.logger.error(
					"Failed to initialize PostgreSQL worker",
					error
				);
			}
		},

		/**
		 * Service stopped lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		async stopped() {},
	};
};
