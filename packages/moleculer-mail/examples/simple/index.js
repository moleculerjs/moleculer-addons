"use strict";

const { ServiceBroker } 	= require("moleculer");
const MailerService 		= require("../../index");

// Create broker
const broker = new ServiceBroker({
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
		}
	}
});

// Start server
broker.start().then(async () => {

	// Call action
	const res = await broker.call("mail.send", {
		from: "adam@email.com",
		to: "hello@moleculer.services",
		subject: "Hello Mailer",
		cc: "john.doe@gmail.com",
		html: "This is a <b>moleculer-mail</b> demo!",
		//text: "This is the text part"
	});

	broker.logger.info("Res:", res);

}).catch(console.error);
