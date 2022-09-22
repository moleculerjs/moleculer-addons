/*
 * moleculer-psql-queue
 * Copyright (c) 2022 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const { run, makeWorkerUtils, Logger } = require("graphile-worker");

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

		methods: {
			/**
			 * Creates a new task
			 * @param {String} name Task name
			 * @param {Object} payload Payload to pass to the task
			 * @param {import('graphile-worker').TaskSpec?} opts
			 */
			createJob(name, payload, opts) {
				this.logger.debug(`Creating job "${name}"`, payload);
				return this.producer.addJob(name, payload, opts);
			},

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
					this.loggerQueue[level](message, meta ? meta : "");
				};
			},
		},

		/**
		 * Service created lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		created() {
			this.loggerQueue = this.broker.getLogger("psql-queue");
		},

		/**
		 * Service started lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		async started() {
			try {
				// Start the producer to add jobs
				this.producer = await makeWorkerUtils({
					connectionString: url,
					...producerOpts,
					logger: new Logger(this.initLogger),
				});

				if (!this.schema.queues) return;

				this.$queue = {};

				_.forIn(this.schema.queues, (fn, name) => {
					if (typeof fn === "function")
						this.$queue[name] = fn.bind(this);
					else {
						this.$queue[name] = fn.process.bind(this);
					}
				});

				// Start the consumer to process jobs:
				this.consumer = await run({
					connectionString: url,
					taskList: this.$queue,
					// Other opts
					...queueOpts,
					logger: new Logger(this.initLogger),
				});

				// Register event handlers
				if (
					this.settings.jobEventHandlers &&
					Object.keys(this.settings.jobEventHandlers).length > 0
				) {
					for (const [eventName, handler] of Object.entries(
						this.settings.jobEventHandlers
					)) {
						this.consumer.events.on(eventName, handler.bind(this));
					}
				}

				// If the worker (`this.consumer`) exits (whether through fatal error or otherwise),
				// this promise will resolve/reject:
				new Promise(async (resolve, reject) => {
					try {
						let res = await this.consumer.promise;
						this.logger.info("Worker stopped", res ? res : "");
						resolve(res);
					} catch (error) {
						this.logger.error("Worker exited", error);
						reject(error);
					}
				});
			} catch (error) {
				this.logger.error(
					"Failed to initialize PostgreSQL worker",
					error
				);

				throw error;
			}
		},

		/**
		 * Service stopped lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		async stopped() {
			if (this.consumer) {
				await this.consumer.stop();
			}
		},
	};
};
