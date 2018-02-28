/*
 * moleculer-bee-queue
 * Copyright (c) 2017 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 	= require("lodash");
const Queue = require("bee-queue");

module.exports = function createService(queueOpts) {

	/**
	 * Task queue mixin service for Bee-Queue
	 *
	 * @name moleculer-bee-queue
	 * @module Service
	 */
	return {
		name: "bee",

		/**
		 * Methods
		 */
		methods: {
			/**
			 * Create a new job
			 *
			 * @param {String} name
			 * @param {any} payload
			 * @returns {Job}
			 */
			createJob(name, payload) {
				return this.getQueue(name).createJob(payload);
			},

			/**
			 * Get a queue by name
			 *
			 * @param {String} name
			 * @returns {Queue}
			 */
			getQueue(name) {
				if (!this.$queues[name]) {
					this.$queues[name] = new Queue(name, queueOpts);
				}
				return this.$queues[name];
			}
		},

		/**
		 * Service created lifecycle event handler
		 */
		created() {
			this.$queues = {};

			if (this.schema.queues) {
				_.forIn(this.schema.queues, (fn, name) => {
					this.getQueue(name).process(fn.bind(this));
				});
			}

			return this.Promise.resolve();
		}
	};
};
