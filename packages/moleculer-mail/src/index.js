/*
 * moleculer-mail
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const fs 			= require("fs");
const path 			= require("path");
const _ 			= require("lodash");
const nodemailer 	= require("nodemailer");
const htmlToText 	= require("nodemailer-html-to-text").htmlToText;
const EmailTemplate = require("email-templates").EmailTemplate;

module.exports = {

	name: "mail",

	settings: {
		// Sender default e-mail address
		from: null,

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

		// Convert HTML body to text
		htmlToText: true,

		// Templates folder
		templateFolder: null
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
				if (ctx.params.template) {
					const templateName = ctx.params.template;
					// Use templates
					const template = this.getTemplate(templateName);
					if (template) {
						// Render template
						return template.render(ctx.params.data || {}, ctx.params.locale).then(rendered => {
							const params = _.omit(ctx.params, ["template", "locale", "data"]);
							params.html = rendered.html;
							if (rendered.text)
								params.text = rendered.text;
							if (rendered.subject)
								params.subject = rendered.subject;

							// Send e-mail
							return this.send(params);
						});
					}
					return this.Promise.reject(new Error("Missing e-mail template: " + templateName));

				} else {
					// Send e-mail
					return this.send(ctx.params);
				}
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Get template renderer by name
		 * 
		 * @param {any} templateName 
		 * @returns 
		 */
		getTemplate(templateName) {
			if (this.templates[templateName]) {
				return this.templates[templateName];
			}

			const templatePath = path.join(this.settings.templateFolder, templateName);
			if (fs.existsSync(templatePath)) {
				this.templates[templateName] = new EmailTemplate(templatePath);
				this.Promise.promisifyAll(this.templates[templateName]);

				return this.templates[templateName];
			}
		},

		/**
		 * Send an email
		 * 
		 * @param {Object} msg 
		 * @returns 
		 */
		send(msg) {
			return new this.Promise((resolve, reject) => {
				this.logger.debug(`Sending email to ${msg.to} with subject ${msg.subject}...`);

				if (!msg.from)
					msg.from = this.settings.from;

				if (this.transporter) {
					this.transporter.sendMail(msg, (err, info) => {
						if (err) {
							this.logger.warn("Unable to send email: ", err);
							reject(err);
						} else {
							this.logger.debug("Email message sent.", info.response);
							resolve(info);
						}
					});
				}
				else 
					return reject(new Error("Unable to send email! Invalid mailer transport: " + this.settings.transport));

			});
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		if (!this.settings.transport) {
			this.logger.error("Missing transport configuration!");
			return;
		}

		this.templates = {};
		if (this.settings.templateFolder) {
			if (!fs.existsSync(this.settings.templateFolder)) {
				/* istanbul ignore next */
				this.logger.warn("The templateFolder is not exists! Path:", this.settings.templateFolder);
			}
		}

		this.transporter = nodemailer.createTransport(this.settings.transport);
		if (this.transporter) {
			if (this.settings.htmlToText)
				this.transporter.use("compile", htmlToText());
		}
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