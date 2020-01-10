/*
 * moleculer-bull
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

let _ = require("lodash");
let Queue = require("bull");

module.exports = function createService(url, queueOpts) {

	/**
	 * Task queue mixin service for Bull
	 *
	 * @name moleculer-bull
	 * @module Service
	 */
	return {
		name: "bull",

		methods: {
			/**
			 * Create a new job
			 *
			 * @param {String} name
			 * @param {any} jobName
			 * @param {any} payload
			 * @param {any} opts
			 * @returns {Job}
			 */
			createJob(name, jobName, payload, opts) {
				if (opts)
					return this.getQueue(name).add(jobName, payload, opts);
				else if (payload)
					return this.getQueue(name).add(jobName, payload);
				else
					return this.getQueue(name).add(jobName);
			},

			/**
			 * Get a queue by name
			 *
			 * @param {String} name
			 * @returns {Queue}
			 */
			getQueue(name) {
				if (!this.$queues[name]) {
					this.$queues[name] = Queue(name, url, queueOpts);
				}
				return this.$queues[name];
			},

			/**
			 * Set metrics for every queue
			 * @param name
			 */
			addMetrics(name) {
				// Collect metrics
				try {
					const queue = this.getQueue(name);
					setInterval(async () => {
						const {completed, active, delayed, failed, waiting} = await queue.getJobCounts();
						this.broker.metrics.set("bull.completed", completed);
						this.broker.metrics.set("bull.active", active);
						this.broker.metrics.set("bull.delayed", delayed);
						this.broker.metrics.set("bull.failed", failed);
						this.broker.metrics.set("bull.waiting", waiting);
					}, 1000);

					// Collect duration job time
					queue.on("completed", job => {
						try {
							if (!job.finishedOn) return;
							const duration = job.finishedOn - job.processedOn;
							this.broker.metrics.observe("bull.completed.duration", duration);
						} catch (err) {
							// silent
						}
					});
				} catch(err) {
					this.logger.warn("Unable to collect bull jobs metrics.", err);
				}
			}
		},

		created() {
			this.$queues = {};
			if(this.broker.metrics) {
				this.logger.info("Metrics enabled");
				this.broker.metrics.register({
					type: "gauge",
					name: "bull.completed",
					labelNames: ["bull","queue"],
					description: "Number of completed messages",
					unit: "job"
				});
				this.broker.metrics.register({
					type: "gauge",
					name: "bull.active",
					labelNames: ["bull","queue"],
					description: "Number of active messages",
					unit: "job"
				});
				this.broker.metrics.register({
					type: "gauge",
					name: "bull.delayed",
					labelNames: ["bull","queue"],
					description: "Number of delayed messages",
					unit: "job"
				});
				this.broker.metrics.register({
					type: "gauge",
					name: "bull.failed",
					labelNames: ["bull","queue"],
					description: "Number of failed messages",
					unit: "job"
				});
				this.broker.metrics.register({
					type: "gauge",
					name: "bull.waiting",
					labelNames: ["bull","queue"],
					description: "Number of waiting messages",
					unit: "job"
				});
				this.broker.metrics.register({
					type: "histogram",
					name: "bull.completed.duration",
					labelNames: ["bull","queue"],
					description: "Time to complete jobs",
					unit: "millisecond",
					maxAgeSeconds: 600,
					ageBuckets: 10
				});
			}
		},

		started() {
			const setHandler = async (handler, name) => {
				let args = [];

				if (handler.name) {
					args.push(handler.name);
				}

				if (handler.concurrency) {
					args.push(handler.concurrency);
				}

				args.push(handler.process.bind(this));

				this.getQueue(name).process(...args);
			};

			if (this.schema.queues) {
				_.forIn(this.schema.queues, async (fn, name) => {
					if(this.broker.metrics) this.addMetrics(name);
					if (typeof fn === "function") {
						this.getQueue(name).process(fn.bind(this));
					} else if (Array.isArray(fn)) {
						for (let handler of fn) {
							setHandler(handler, name);
						}
					} else {
						setHandler(fn, name);
					}
				});
			}

			return this.Promise.resolve();
		}
	};
};
