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
		// Can also be inside settings.template
		transport: {
			host: "smtp.mailtrap.io",
			port: 2525,
			auth: {
				user: "367335eaa82697636",
				pass: "e5a76af9b056d0"
			}
		},
		template: {
			views: {
				root: path.join(__dirname, "templates")
			}
		}
	}
});

// Start server
broker.start().then(() => {
	// Send a default welcome email
	broker.call("mail.send", {
		message: {
			to: "hello@moleculer.services",
		},
		template: "welcome",
		locals: {
			locale: "hu-HU", // Localized e-mail template
			name: "John Doe",
			username: "john.doe",
			verifyToken: "123456"
		}
	})
	.then(console.log)
	.catch(console.error);
});
