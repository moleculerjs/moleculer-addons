/*
 * moleculer-twilio
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const { MoleculerError } = require("moleculer");
const TwilioClient = require("twilio");

module.exports = {

	name: "twilio",

	/**
	 * Default settings
	 */
	settings: {
		accountSid: process.env.TWILIO_ACCOUNT_SID,
		authToken: process.env.TWILIO_AUTH_TOKEN,
		phoneNumber: process.env.TWILIO_PHONE_NUMBER
	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Send an SMS
		 * 
		 * @param {String} to - Target phone number
		 * @param {String} message - Message text
		 * @param {String} [mediaUrl] - Media URL
		 * @returns {String}
		 */
		send: {
			params: {
				to: { type: "string" },
				message: { type: "string" },
				mediaUrl: { type: "string", optional: true }
			},
			handler(ctx) {
				return this.sendSMS(ctx.params.to, ctx.params.message);
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
		 * @param {String} to - Target phone number
		 * @param {String} [body=""] - Body of SMS
		 * @param {String} [mediaUrl] - Media URL
		 * @returns {String}
		 */
		sendSMS(to, body = "", mediaUrl) {
			this.logger.debug(`Sending SMS to '${to}' phone number. Message: ${body}`);
			return this.client.messages.create({
				from: this.settings.phoneNumber,
				to,
				body,
				mediaUrl
			}).then(data => {
				this.logger.debug(`The SMS sent to '${to}' successfully!`, data);
				return data;
			}).catch(err => {
				// Possible errors: https://www.twilio.com/docs/api/rest/request#get-responses
				return new MoleculerError(err.message, 500, "SMS_SEND_ERROR", err.data);
			});
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		if (this.settings.accountSid == null)
			this.logger.warn("The `accountSid` is not configured. Please set the 'TWILIO_ACCOUNT_SID' environment variable!");
		if (this.settings.authToken == null)
			this.logger.warn("The `authToken` is not configured. Please set the 'TWILIO_AUTH_TOKEN' environment variable!");
		if (this.settings.phoneNumber == null)
			this.logger.warn("The `phoneNumber` is not configured. Please set the 'TWILIO_PHONE_NUMBER' environment variable!");

		return this.Promise.resolve();
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.client = new TwilioClient(this.settings.accountSid, this.settings.authToken);

		return this.Promise.resolve();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		return this.Promise.resolve();
	}
};