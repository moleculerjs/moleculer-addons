/*
 * moleculer-svc-fake
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-svc-fake)
 * MIT Licensed
 */

"use strict";

module.exports = {

	name: "fake",

	/**
	 * Default settings
	 */
	settings: {

	},

	/**
	 * Actions
	 */
	actions: {
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