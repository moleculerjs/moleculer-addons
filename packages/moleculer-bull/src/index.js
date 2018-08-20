/*
 * moleculer-bull
 * Copyright (c) 2017 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

let _ 		= require("lodash");
let Queue 	= require("bull");

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
				if(opts)
					return this.getQueue(name).add(jobName, payload, opts);
				else
					if (payload)
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
			}
		},

		created() {
			this.$queues = {};

			if (this.schema.queues) {
				_.forIn(this.schema.queues, (inline, name) => {
					if (typeof inline === "function") {
						this.getQueue(name).process('inline', inline.bind(this));
					} else if (typeof inline === 'object') {
						if (Array.isArray(inline)) {
							for (let handler of inline) {
								let args = [];

								if (handler.name) {
									args.push(handler.name);
								}
								if (handler.concurrency) {
									args.push(handler.concurrency);
								}

								args.push(handler.process.bind(this));

								this.getQueue(name).process(...args);
							}
						} else {
							for (let handler in inline) {
								this.getQueue(name).process(handler, inline[handler].bind(this));
							}
						}
					}
				});
			}

			return this.Promise.resolve();
		}
	};
};
