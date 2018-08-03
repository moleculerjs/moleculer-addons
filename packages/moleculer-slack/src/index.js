/*
 * moleculer-slack
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const { MoleculerError } = require("moleculer").Errors;
const { WebClient } = require("@slack/client");

require("dotenv").config();
/**
 * Send a message using the Slack API.
 *
 * https://www.slack.com
 *
 * @module Service
 */
module.exports = {
	name: "slack",

	/**
	 * Settings
	 */
	settings: {
		/** @type {String} Visit https://github.com/slackapi/node-slack-sdk for documentation */
		slackToken: process.env.SLACK_TOKEN,
		/** @type {String} Visit https://github.com/slackapi/node-slack-sdk for documentation */
		slackChannel: process.env.SLACK_CHANNEL,
	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Send a message
		 *
		 * @actions
		 * @param {String} message - Message text
		 * @returns {String}
		 */
		send: {
			params: {
				channel: { type: "string", optional: true },
				message: { type: "string" }
			},
			handler(ctx) {
				return this.sendMessage(ctx.params.message, ctx.params.channel);
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {

		/**
		 * Send an SMS
		 *
		 * @methods
		 * @param {String} [message] - Message
		 * @param {String} [channel] - Channel
		 * @returns {String}
		 */
		sendMessage(message, channel) {
			channel = channel || this.settings.slackChannel;
			this.logger.debug(`Sending message to '${channel}' slack channel. Message: ${message}`);

			return this.client.chat.postMessage({ channel: channel, text: message})
				.then(res => {
					this.logger.debug(`The Message sent to '${channel}' successfully! Ts: ${res.ts}`);
					return res;
				}).catch(err => {
					// Possible errors: https://www.slack.com
					return this.Promise.reject(new MoleculerError(err.message + " " + err.detail, 500, "POSTMESSAGE_ERROR"));
				});

		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		/* istanbul ignore next */
		if (this.settings.slackToken == null)
			this.logger.warn("The `slackToken` is not configured. Please set the 'SLACK_TOKEN' environment variable!");

		return this.Promise.resolve();
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.client = new WebClient(this.settings.slackToken);
		return this.Promise.resolve();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		/* istanbul ignore next */
		return this.Promise.resolve();
	}
};
