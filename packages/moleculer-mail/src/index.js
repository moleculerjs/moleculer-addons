/*
 * moleculer-mail
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const path = require("path");

const { MoleculerError, MoleculerRetryableError } = require("moleculer").Errors;
const nodemailer = require("nodemailer");
const Email = require("email-templates");

module.exports = {

	name: "mail",

	settings: {
		/* SMTP: https://nodemailer.com/smtp/
		transport: {
			host: "smtp.mailtrap.io",
			port: 2525,
			auth: {
				user: "",
				pass: ""
			}
		},
		*/

		/* for Gmail service - https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json
		transport: {
			service: "gmail",
			auth: {
				user: "",
				pass: ""
			}
		},
		*/
		// Shortcut for this.settings.template.transport
		transport: null,

		// Template configuration
		// See https://github.com/niftylettuce/email-templates
		template: null,

		// Common locals (for templates)
		locals: {},
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Send an email to recipients
		 */
		send: {
			handler(ctx) {
				const params = _.defaultsDeep(ctx.params, { locals: this.settings.locals });
				return this.send(params);
			},
		},
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Transform params to be compatible with email-templates
		 * @param msg
		 */
		sanitize(msg) {
			const cleanMsg = _.defaultsDeep(msg, { message: {} });

			// Move nodemailer fields inside message fields
			["from", "to", "cc", "bcc", "subject", "text", "html", "attachments"]
				.filter(key => !!msg[key])
				.forEach(key => {
					cleanMsg.message[key] = _.clone(msg[key]);
					delete cleanMsg[key];
				});

			// Handle i18n as email-templates@2 instead of email-templates@3
			if (msg.template && msg.locals && msg.locals.locale) {
				cleanMsg.template = path.join(msg.template, msg.locals.locale); // Go inside locale template directory
				delete cleanMsg.locals.locale; // Remove fields to prevent email-template doing it's own i18n
			}

			return cleanMsg;
		},

		/**
		 * Send an email
		 *
		 * @param {Object} msg
		 * @returns
		 */
		send(msg) {
			const cleanMsg = this.sanitize(msg);

			this.logger.debug(`Sending email to ${cleanMsg.message.to} with subject '${cleanMsg.message.subject}'...`);

			if (!this.transporter) {
				return this.Promise.reject(new MoleculerError("Unable to send email! Invalid mailer transport: " + this.settings.transport));
			}

			return this.emailTemplate.send(cleanMsg)
				.catch((err) => {
					this.logger.warn("Unable to send email: ", err);
					return this.Promise.reject(new MoleculerRetryableError("Unable to send email! " + err.message));
				})
				.then((info) => {
					this.logger.info("Email message sent.", info.response);
					return info;
				});
		},
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		// Transporter config lookup
		// 1. createTransport function
		// 2. this.settings.transport
		// 3. this.settings.template.transport
		if (_.isFunction(this.createTransport)) {
			this.transporter = this.createTransport();
		} else if (this.settings.transport) {
			this.transporter = nodemailer.createTransport(this.settings.transport);
		} else if (this.settings.template && this.settings.template.transport) {
			this.transporter = nodemailer.createTransport(this.settings.template.transport);
		} else {
			this.logger.error("Missing transport configuration!");
			return;
		}

		const config = _.defaults(this.settings.template, { transport: this.transporter });
		this.emailTemplate = new Email(config);
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

	},
};
