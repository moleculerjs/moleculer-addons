/*
 * moleculer-queue-bull
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

let _ = require("lodash");
let Queue = require("bull");

module.exports = function createService(connOpts) {

	/**
	 * Task queue service with Bull
	 * 
	 * @name moleculer-queue-bull
	 * @module Service
	 */
	return {
		name: "bull",

		methods: {
			/**
			 * Enqueue a new task
			 * 
			 * @param {String} name 
			 * @param {any} payload 
			 * @returns 
			 */
			enqueue(name, payload) {
				this.getQueue(name).add(payload);
			},

			/**
			 * Get a queue by name
			 * 
			 * @param {String} name 
			 * @returns {Queue}
			 */
			getQueue(name) {
				if (!this._queues[name]) {
					this._queues[name] = Queue(name, connOpts);
				}
				return this._queues[name];
			}
		},

		created() {
			this._queues = {};

			if (this.schema.queues) {
				_.forIn(this.schema.queues, (fn, name) => {
					this.getQueue(name).process(fn.bind(this));
				});
			}

			return this.Promise.resolve();
		},

		started() {
			return this.Promise.resolve();
		},

		stopped() {
			return this.Promise.resolve();
		}
	};
};