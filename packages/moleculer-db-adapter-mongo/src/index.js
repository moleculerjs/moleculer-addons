/*
 * moleculer-db-adapter-mongo
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

/**
 * MongoDB native adapter for Moleculer DB service.
 * 
 * @name moleculer-db-adapter-mongo
 * @module Service
 */
module.exports = {

	name: "mongo",

	/**
	 * Default settings
	 */
	settings: {

	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Hello World test action
		 * 
		 * @actions
		 * 
		 * @param {String} name - Name of user
		 * @returns {String}
		 */
		test(ctx) {
			return "Hello " + (ctx.params.name || "Anonymous");
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
		return this.Promise.resolve();
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		return this.Promise.resolve();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		return this.Promise.resolve();
	}
};