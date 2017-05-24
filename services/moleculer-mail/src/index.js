/*
 * moleculer-mail
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

let nodemailer 	= require("nodemailer");
let htmlToText 	= require("nodemailer-html-to-text").htmlToText;

module.exports = {

	name: "mail",

	settings: {
		// Sender e-mail address
		sender: "moleculer@company.net",

		/* https://nodemailer.com/transports/sendmail/
		transport: {
			type: "sendmail",
			options: {
				sendmail: true,
				newline: 'unix',
				path: '/usr/sbin/sendmail'
			}
		}
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
		}
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
		}
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
		}
		*/

		/* https://github.com/sendgrid/nodemailer-sendgrid-transport
		transport: {
			type: "sendgrid",
			options: {
				auth: {
					api_key: ""
				}
			}
		}
		*/		

		// Convert HTML body to text
		htmlToText: true
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Send an email to recipients
		 */
		send: {
			params: {
				sender: { type: "email", optional: true },
				recipients: { type: "string" },
				subject: { type: "string" },
				html: { type: "string", optional: true },
				text: { type: "string", optional: true }
			},
			handler(ctx) {
				let { sender, recipients, subject, html, text } = ctx.params;
				return this.send(sender, recipients, subject, html, text);
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

		/**
		 * Send an email to recipients
		 * 
		 * @param {String} recipients 
		 * @param {String} subject 
		 * @param {String} html 
		 * @param {String} text 
		 * @returns 
		 */
		send(sender, recipients, subject, html, text) {
			return new this.Promise((resolve, reject) => {
				this.logger.debug(`Sending email to ${recipients} with subject ${subject}...`);

				let mailOptions = {
					from: sender || this.settings.sender,
					to: recipients,
					subject,
					html,
					text
				};

				let transporter = this.getTransporter();
				if (transporter) {
					if (this.settings.htmlToText && html && !text)
						transporter.use("compile", htmlToText());

					transporter.sendMail(mailOptions, (err, info) => {
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