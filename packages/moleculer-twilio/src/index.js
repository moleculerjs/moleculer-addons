/*
 * moleculer-twilio
 * Copyright (c) 2017 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const { MoleculerError } = require("moleculer").Errors;
const TwilioClient = require("twilio");

/**
 * Send a message using the Twilio API.
 * 
 * https://www.twilio.com
 * 
 * @module Service
 */
module.exports = {
	name: "twilio",

	/**
	 * Settings
	 */
	settings: {
		/** @type {String} Twilio account Sid. Visit your [Twilio dashboard's](https://www.twilio.com/console/voice/dashboard) main page. Click "Show API Credentials", then copy and paste your "ACCOUNT SID" here or set `TWILIO_ACCOUNT_SID` env var. */
		accountSid: process.env.TWILIO_ACCOUNT_SID,
		/** @type {String} Twilio auth token. Visit your [Twilio dashboard's](https://www.twilio.com/console/voice/dashboard) main page. Click "Show API Credentials", then copy and paste your "AUTH TOKEN" here or set `TWILIO_AUTH_TOKEN` env var. */
		authToken: process.env.TWILIO_AUTH_TOKEN,
		/** @type {String} This is the 'From' phone number you'd like to use to send the SMS. This phone number is assigned to you by [Twilio](https://www.twilio.com/console/phone-numbers/incoming). */
		phoneNumber: process.env.TWILIO_PHONE_NUMBER
	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Send an SMS
		 * 
		 * @actions
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
				return this.sendSMS(ctx.params.to, ctx.params.message, ctx.params.mediaUrl);
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
			}).then(sms => {
				this.logger.debug(`The SMS sent to '${to}' successfully! Sid: ${sms.sid}`);
				return sms;
			}).catch(err => {
				// Possible errors: https://www.twilio.com/docs/api/rest/request#get-responses
				return this.Promise.reject(new MoleculerError(err.message + " " + err.detail, 500, "SMS_SEND_ERROR"));
			});
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		/* istanbul ignore next */
		if (this.settings.accountSid == null)
			this.logger.warn("The `accountSid` is not configured. Please set the 'TWILIO_ACCOUNT_SID' environment variable!");
		
		/* istanbul ignore next */
		if (this.settings.authToken == null)
			this.logger.warn("The `authToken` is not configured. Please set the 'TWILIO_AUTH_TOKEN' environment variable!");
		
		/* istanbul ignore next */
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
		/* istanbul ignore next */
		return this.Promise.resolve();
	}
};