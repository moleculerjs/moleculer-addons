"use strict";

let { ServiceBroker } 	= require("moleculer");
let MailerService 		= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(MailerService, {
	settings: {
		transport: {
			type: "smtp",
			options: {
				host: "smtp.mailtrap.io",
				port: 2525,
				auth: {
					user: "367335eaa82697636",
					pass: "e5a76af9b056d0"
				}
			}
		}		
	}
});

// Start server
broker.start().then(() => {

	// Call action
	broker.call("mail.send", { 
		from: "mereg.norbert@gmail.com",
		to: "hello@moleculer.services", 
		subject: "Hello Mailer", 
		cc: "icebobcsi@gmail.com",
		html: "This is a <b>moleculer-mail</b> demo!",
		//text: "This is the text part"
	})
	.then(console.log)
	.catch(console.error);

});
