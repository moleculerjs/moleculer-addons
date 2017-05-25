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
				user: "367335eaa82697636",
				pass: "e5a76af9b056d0"
			}
		},
		templateFolder: path.join(__dirname, "templates")
	}
});

// Start server
broker.start().then(() => {

	// Send a default welcome email
	broker.call("mail.send", { 
		to: "hello@moleculer.services", 
		subject: "Hello Mailer", 
		template: "welcome",
		locale: "hu-HU", // Localized e-mail template
		data: {
			name: "John Doe",
			username: "john.doe",
			verifyToken: "123456"
		}
	})
	.then(console.log)
	.catch(console.error);

});
