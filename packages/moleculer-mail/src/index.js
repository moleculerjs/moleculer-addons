/*
 * moleculer-mail
 * Copyright (c) 2022 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const fs 			= require("fs");
const path 			= require("path");
const _ 			= require("lodash");
const glob 			= require("glob").sync;

const { MoleculerError, MoleculerRetryableError } 	= require("moleculer").Errors;
const nodemailer 			= require("nodemailer");
const htmlToText 			= require("nodemailer-html-to-text").htmlToText;
const consolidate = require("consolidate");

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
		templateFolder: null,

		fallbackLanguage: "en",

		// Common data
		data: {}
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
				template: "string|optional",
				language: "string|optional",
				to: "string",
				data: "object|optional",
				attachments: "array|optional",
				text: "string|optional",
				html: "string|optional",
				subject: "string|optional",
			},
			async handler(ctx) {
				const data = _.defaultsDeep({}, ctx.params.data, this.settings.data);
				if (ctx.params.template) {
					const templateName = ctx.params.template;
					// Use templates
					const template = this.getTemplate(templateName, ctx.params.language);
					if (template) {
						// Render template
						const rendered = await template(data);
						const params = _.omit(ctx.params, ["template", "language", "data"]);
						params.html = params.html || rendered.html;
						if (rendered.text && !params.text) params.text = rendered.text;
						if (rendered.subject && !params.subject) {
							params.subject = rendered.subject;
						}

						// Send e-mail
						return this.send(params);
					}
					return this.Promise.reject(new MoleculerError("Missing e-mail template: " + templateName));

				} else {
					// Send e-mail
					const params = _.omit(ctx.params, ["template", "language", "data"]);
					return this.send(params);
				}
			}
		},

		render: {
			params: {
				template: "string",
				language: "string|optional",
				data: "object"
			},
			async handler(ctx) {
				const data = _.defaultsDeep(ctx.params.data || {}, this.settings.data);
				const template = this.getTemplate(ctx.params.template, ctx.params.language);
				return await template(data);
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
		getTemplate(templateName, language) {
			if (!language) language = this.settings.fallbackLanguage;

			const key = templateName + "-" + language;
			if (this.templates[key]) {
				return this.templates[key];
			}

			const templatePath = path.join(this.settings.templateFolder, language, templateName);
			if (!fs.existsSync(templatePath)) {
				if (language != this.settings.fallbackLanguage) {
					return this.getTemplate(templateName, this.settings.fallbackLanguage);
				}
				return null;
			}

			const files = glob("*.*", { cwd: templatePath });
			if (files.length == 0) return;

			this.templates[key] = async data => {
				const res = {};

				await Promise.all(
					files.map(async file => {
						const fullPath = path.join(templatePath, file);
						const content = fs.readFileSync(fullPath, "utf8");
						const ext = path.extname(fullPath);
						const name = path.basename(fullPath, ext);
						if (ext == ".pug") res[name] = await consolidate.pug.render(content, data);
						if (ext == ".hbs")
							res[name] = await consolidate.handlebars.render(content, data);
						if (ext == ".njk")
							res[name] = await consolidate.nunjucks.render(content, data);
					})
				);

				return res;
			};

			return this.templates[key];
		},

		/**
		 * Send an email
		 *
		 * @param {Object} msg
		 * @returns
		 */
		send(msg) {
			return new this.Promise((resolve, reject) => {
				this.logger.debug(`Sending email to ${msg.to} with subject '${msg.subject}'...`);

				if (!msg.from) msg.from = this.settings.from;

				if (this.transporter) {
					this.transporter.sendMail(msg, (err, info) => {
						if (err) {
							this.logger.warn("Unable to send email: ", err);
							reject(
								new MoleculerRetryableError("Unable to send email! " + err.message)
							);
						} else {
							this.logger.info("Email message sent.", info.response);
							resolve(info);
						}
					});
				} else
					return reject(
						new MoleculerError(
							"Unable to send email! Invalid mailer transport: " +
								this.settings.transport
						)
					);
			});
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.templates = {};
		if (this.settings.templateFolder) {
			if (!fs.existsSync(this.settings.templateFolder)) {
				/* istanbul ignore next */
				this.logger.warn("The templateFolder is not exists! Path:", this.settings.templateFolder);
			}
		}

		if (_.isFunction(this.createTransport)) {
			this.transporter = this.createTransport();

		} else {
			if (!this.settings.transport) {
				this.logger.error("Missing transport configuration!");
				return;
			}

			this.transporter = nodemailer.createTransport(this.settings.transport);
		}

		if (this.transporter && this.settings.htmlToText) {
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
