"use strict";

const { ServiceBroker } 	= require("moleculer");
const MailerService 		= require("../../index");
const path 					= require("path");

// Create broker
const broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(MailerService, {
	settings: {
		fallbackLanguage: "en",
		transport: {
			host: "smtp.mailtrap.io",
			port: 2525,
			auth: {
				user: process.env.MAILTRAP_USER,
				pass: process.env.MAILTRAP_PASS
			}
		},
		templateFolder: path.join(__dirname, "templates")
	}
});

// Start server
broker.start().then(async () => {

	// Send a default welcome email
	const res = await broker.call("mail.send", {
		to: "hello@moleculer.services",
		subject: "Hello Mailer",
		template: "welcome",
		language: "hu", // Localized e-mail template
		data: {
			name: "John Doe",
			username: "john.doe",
			verifyToken: "123456"
		}
	});
	broker.logger.info("Res:", res);

}).catch(console.error);

