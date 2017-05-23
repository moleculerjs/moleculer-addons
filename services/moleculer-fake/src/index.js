/*
 * moleculer-fake
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const Fakerator = require("fakerator");
const _ = require("lodash");

module.exports = {

	name: "fake",

	/**
	 * Default settings
	 */
	settings: {
		language: "hu-HU" // default
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Generate fake data
		 * 
		 * @param {any} ctx 
		 * @returns {Promise}
		 */
		generate(ctx) {
			const type = ctx.params.type || "entity.user";
			const fn = _.get(this.fakerator, type);
			if (fn) {
				if (ctx.params.times)
					return this.fakerator.times(fn, ctx.params.times);
				else
					return fn();
			} else
				return this.Promise.reject(new Error("Invalid type: " + type));
		}
	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.fakerator = Fakerator(this.settings.language)
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};