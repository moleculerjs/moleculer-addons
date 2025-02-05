/*
 * moleculer-psql-queue
 * Copyright (c) 2025 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const { forIn, defaultsDeep } = require("lodash");
const { run, makeWorkerUtils, Logger } = require("graphile-worker");

/**
 * Creates a PsqlQueueService
 *
 * @param {String} url Connection String
 * @param {WorkerOpts} opts Worker options
 *
 * @returns {import('moleculer').ServiceSchema}
 */
module.exports = function createService(url, opts = {}) {
	/** @type {WorkerOpts} */
	const {
		producerOpts,
		queueOpts,
		schemaProperty,
		createJobMethodName,
		producerPropertyName,
		consumerPropertyName,
		internalQueueName,
		jobEventHandlersSettingsProperty,
	} = defaultsDeep(opts, {
		producerOpts: {},
		queueOpts: {
			concurrency: 5,
			// Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
			noHandleSignals: false,
			pollInterval: 1000,
		},

		schemaProperty: "queues",
		createJobMethodName: "createJob",
		producerPropertyName: "$producer",
		consumerPropertyName: "$consumer",
		internalQueueName: "$queue",
		jobEventHandlersSettingsProperty: "jobEventHandlers",
	});

	/** @type {import('moleculer').ServiceSchema} */
	return {
		name: "psql-queue",

		settings: {
			/**
			 * @type {Number} Delay between reconnection attempts
			 */
			$queueReconnectionDelay: 2000,
		},

		methods: {
			/**
			 * Creates a new task
			 * @param {String} name Task name
			 * @param {Object} payload Payload to pass to the task
			 * @param {import('graphile-worker').TaskSpec?} opts
			 */
			async [createJobMethodName](name, payload, opts) {
				this.logger.debug(`Creating job "${name}"`, payload);
				const job = await this[producerPropertyName].addJob(
					name,
					payload,
					opts
				);

				this.logger.debug(`Job "${name}" created`, job);

				return job;
			},

			/**
			 * Replaces Default logger with Moleculer logger
			 * More info: https://github.com/graphile/worker#logger
			 */
			initWorkerLogger() {
				/**
				 * @param {String} level Log level
				 * @param {String} message Message to log
				 * @param {Object} meta  Additional metadata
				 */
				return (level, message, meta) => {
					this.$loggerQueue[level](message, meta ? meta : "");
				};
			},

			async tryConnectWorker() {
				if (this.$connectedToQueue) return;

				this.logger.debug(
					"Trying to connect with PostgreSQL server...",
					url
				);

				// Start the producer to add jobs
				this[producerPropertyName] = await makeWorkerUtils({
					connectionString: url,
					...producerOpts,
					logger: new Logger(this.initWorkerLogger),
				});

				if (!this.schema[schemaProperty]) {
					// All good. Connected to queue
					this.$connectedToQueue = true;

					return;
				}

				this[internalQueueName] = {};

				forIn(this.schema[schemaProperty], (fn, name) => {
					if (typeof fn === "function")
						this[internalQueueName][name] = fn.bind(this);
					else {
						this[internalQueueName][name] = fn.process.bind(this);
					}
				});

				// Start the consumer to process jobs:
				this[consumerPropertyName] = await run({
					connectionString: url,
					taskList: this[internalQueueName],
					// Other opts
					...queueOpts,
					logger: new Logger(this.initWorkerLogger),
				});

				// Register event handlers
				if (
					this.settings[jobEventHandlersSettingsProperty] &&
					Object.keys(this.settings[jobEventHandlersSettingsProperty])
						.length > 0
				) {
					for (const [eventName, handler] of Object.entries(
						this.settings[jobEventHandlersSettingsProperty]
					)) {
						this[consumerPropertyName].events.on(
							eventName,
							handler.bind(this)
						);
					}
				}

				// All good. Connected to queue
				this.$connectedToQueue = true;
			},

			connectWorker() {
				return new Promise((resolve) => {
					const doConnect = () => {
						this.tryConnectWorker()
							.then(() => {
								this.logger.info(
									"Ready to process jobs from PostgreSQL server"
								);
								resolve();
							})
							.catch((err) => {
								this.$connectedToQueue = false;

								this.logger.error(
									"PostgreSQL worker queue connection error",
									err
								);
								setTimeout(() => {
									this.logger.info("Reconnecting...");
									doConnect();
								}, this.settings.$queueReconnectionDelay);
							});
					};

					doConnect();
				});
			},
		},

		/**
		 * Service created lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		created() {
			this.$loggerQueue = this.broker.getLogger("psql-queue");

			this.$connectedToQueue = false;

			this.$terminationSignalTriggered = false;

			const _closeFn = () => {
				this.$terminationSignalTriggered = true;
			};
			process.on("SIGINT", _closeFn);
			process.on("SIGTERM", _closeFn);
		},

		/**
		 * Service started lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		async started() {
			await this.connectWorker();

			if (
				this[consumerPropertyName] &&
				this[consumerPropertyName].promise
			) {
				// If the worker exits (whether through fatal error or otherwise), this
				// promise will resolve/reject:
				this[consumerPropertyName].promise.catch((error) => {
					this.$connectedToQueue = false;
					this.logger.error("PostgreSQL worker queue error", error);
					this.connectWorker();
				});
			}
		},

		/**
		 * Service stopped lifecycle event handler
		 * @this {import('moleculer').Service}
		 */
		async stopped() {
			if (
				!this.$terminationSignalTriggered &&
				this[consumerPropertyName] &&
				this[consumerPropertyName].stop
			) {
				await this[consumerPropertyName].stop();
			}

			if (
				this[producerPropertyName] &&
				this[producerPropertyName].release
			) {
				await this[producerPropertyName].release();
			}
		},
	};
};

/**
 * @typedef WorkerOpts
 * @property {String} schemaProperty Name of the property in service schema.
 * @property {String} createJobMethodName Name of the method in Service to create jobs
 * @property {String} producerPropertyName Name of the property in Service to produce jobs
 * @property {String} consumerPropertyName Name of the property in Service to consume jobs
 * @property {String} internalQueueName Name of the internal queue that's used to store the job handlers
 * @property {String} jobEventHandlersSettingsProperty Name of the property in Service settings to register job event handlers
 * @property {import('graphile-worker').RunnerOptions} queueOpts Queue options. More info: https://github.com/graphile/worker#runneroptions
 * @property {import('graphile-worker').WorkerUtilsOptions} producerOpts Producer options. More info: https://github.com/graphile/worker#workerutilsoptions
 */
