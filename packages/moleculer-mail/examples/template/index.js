"use strict";

let { ServiceBroker } 	= require("moleculer");
let MailerService 		= require("../../index");
let path 				= require("path");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(MailerService, {
	settings: {
		transport: {
			host: "smtp.mailtrap.io",
			port: 2525,
			auth: {
				user: process.env.MAILTRAP_USER,
				pass: process.env.MAILTRAP_PASS
			}
		},
		templateFolder: path.join(__dirname, "templates"),
		i18n: {
			"en": {
				"hi": "Hi {{name}}!"
			},

			"hu-HU": {
				"hi": "Szia, {{name}}!"
			}
		}
	}
});

// Start server
broker.start().then(() => {

	// Send a default welcome email
	broker.call("mail.send", {
		from: "template-test@moleculer.services",
		to: "hello@moleculer.services",
		subject: "Hello Mailer",
		template: "welcome",
		locale: "hu", // Localized e-mail template
		data: {
			name: "John Doe",
			username: "john.doe",
			verifyToken: "123456"
		}
	})
		.then(console.log)
		.catch(console.error);

});
