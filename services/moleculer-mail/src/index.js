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
		from: "moleculer@company.net",

		/* https://nodemailer.com/transports/sendmail/
		transport: {
			type: "sendmail",
			options: {
				sendmail: true,
				newline: "unix",
				path: "/usr/sbin/sendmail"
			}
		},
		*/

		/* https://nodemailer.com/smtp/
		transport: {
			type: "smtp",
			options: {
				host: "smtp.mailtrap.io",
				port: 2525,
				auth: {
					user: "",
					pass: ""
				}
			}
		},
		*/

		/*
		transport: {
			type: "smtp",
			options: {
				host: "smtp.gmail.com",
				port: 465,
				secure: true,
				auth: {
					user: "",
					pass: ""
				}
			}
		},
		*/

		/* https://github.com/orliesaurus/nodemailer-mailgun-transport
		transport: {
			type: "mailgun",
			options: {
				auth: {
					api_key: '',
					domain: ''
				}
			}
		},
		*/

		/* https://github.com/sendgrid/nodemailer-sendgrid-transport
		transport: {
			type: "sendgrid",
			options: {
				auth: {
					api_key: ""
				}
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
			/* Need add all fields from https://nodemailer.com/message/
			params: {
				from: { type: "email", optional: true },
				to: { type: "string" },
				cc: { type: "string", optional: true },
				bcc: { type: "string", optional: true },
				subject: { type: "string" },
				text: { type: "string", optional: true },
				html: { type: "string", optional: true },
				attachments: { type: "array", optional: true }
			},*/
			handler(ctx) {
				if (ctx.params.template) {
					// Use templates
					const template = this.getTemplate(ctx);
					if (template) {
						// Render template
						return template.render(ctx.params.data, ctx.params.locale).then(rendered => {
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
					return this.Promise.reject(new Error("Missing e-mail template:", ctx.params.template));

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
		getTransporter() {
			switch(this.settings.transport.type) {
			case "sendmail":
			case "smtp": {
				return nodemailer.createTransport(this.settings.transport.options);
			}
			case "mailgun": {
				let mg = require("nodemailer-mailgun-transport");
				return nodemailer.createTransport(mg(this.settings.transport.options));
			}
			case "sendgrid": {
				let sgTransport = require("nodemailer-sendgrid-transport");
				return nodemailer.createTransport(sgTransport(this.settings.transport.options));
			}
			}
		},

		getTemplate(ctx) {
			const templateName = ctx.params.template;
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
		 * Send an email to recipients
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
		if (!this.settings.transport || !this.settings.transport.type) {
			this.logger.error("Missing mailer transport configuration!");
			return;
		}

		this.templates = {};
		if (this.settings.templateFolder) {
			if (!fs.existsSync(this.settings.templateFolder)) {
				this.logger.warn("The templateFolder is not exists! Path:", this.settings.templateFolder);
			}
		}

		this.transporter = this.getTransporter();
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