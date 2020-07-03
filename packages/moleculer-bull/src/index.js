/*
 * moleculer-bull
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
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
					// If queue options are present use them over the parent mixin options
					// This allows a user to override the service wide queue options
					let queueOptions = null;
					// First check if queues has been defined and if so find the queue
					const foundQueue = this.schema.queues && this.schema.queues[name];
					// If found, pull the queue options out, which could be null or undefined
					if(foundQueue){
						queueOptions = foundQueue.options;
					}
					// Only apply custom queue options if they are present, if not use the global mixin
					// options object
					this.$queues[name] = Queue(name, url, queueOptions ? queueOptions : queueOpts);
				}
				return this.$queues[name];
			}
		},

		created() {
			this.$queues = {};
		},

		started() {
			const setHandler = (handler, name) => {
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
				_.forIn(this.schema.queues, (fn, name) => {
					if(typeof fn === "function")
						this.getQueue(name).process(fn.bind(this));
					else if(Array.isArray(fn)){
						for(let handler of fn){
							setHandler(handler, name);
						}
					}else {
						setHandler(fn, name);
					}
				});
			}

			return this.Promise.resolve();
		}
	};
};
