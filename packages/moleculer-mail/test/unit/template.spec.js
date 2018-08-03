"use strict";

const { ServiceBroker } = require("moleculer");
const MailService = require("../../src");
const _ = require("lodash");

describe("Test MailService template handling", () => {

	it("should create an empty templates prop", () => {
		const broker = new ServiceBroker({ logger: false});
		const service = broker.createService(MailService, { settings: { transport: {} } });
		expect(service).toBeDefined();
		expect(service.templates).toEqual({});
	});

	it("should create templates", () => {
		const broker = new ServiceBroker({ logger: false});
		const service = broker.createService(MailService, { settings: { transport: {}, templateFolder: __dirname + "/templates" } });

		expect(Object.keys(service.templates).length).toBe(0);
		let tmp = service.getTemplate("welcome");
		expect(tmp).toBeDefined();
		expect(service.templates.welcome).toBe(tmp);
	});

	it("should create templates", () => {
		const broker = new ServiceBroker({ logger: false});
		const service = broker.createService(MailService, { settings: {
			transport: {},
			templateFolder: __dirname + "/templates"
		} });

		return broker.start()
			.then(() => {
				// Mocking
				service.send = jest.fn(() => Promise.resolve());
				let tmp = service.getTemplate("welcome");
				tmp.render = jest.fn(() => Promise.resolve({
					html: "<h1>Hello</h1>",
					text: "Hello",
					subject: "Hello Subject"
				}));

				// Call
				return broker.call("mail.send", {
					template: "welcome",
					to: "john.doe@johndoe.com",
					data: {
						name: "John"
					}
				}).then(() => {
					expect(tmp.render).toHaveBeenCalledTimes(1);
					expect(tmp.render).toHaveBeenCalledWith({ name: "John" }, undefined);

					expect(service.send).toHaveBeenCalledTimes(1);
					expect(service.send).toHaveBeenCalledWith({"to": "john.doe@johndoe.com", "html": "<h1>Hello</h1>", "subject": "Hello Subject", "text": "Hello"});
				});

			})
			.then(() => broker.stop());
	});


	describe("should render templates", () => {
		let broker, service;
		let spySend = jest.fn(() => Promise.resolve());
		beforeEach(() => {
			broker = new ServiceBroker({ logger: false});
			service = broker.createService(MailService, { settings: { transport: { type: "sendmail" }, templateFolder: __dirname + "/templates" } });
			service.send = spySend;
			return broker.start();
		});

		afterEach(() => broker.stop());

		it("should render default template without localization", () => {
			service.send.mockClear();

			return broker.call("mail.send", {
				template: "full",
				subject: "Full",
				to: "john.doe@johndoe.com",
				data: {
					name: "John"
				}
			}).then(() => {
				expect(service.send).toHaveBeenCalledTimes(1);
				expect(service.send).toHaveBeenCalledWith({"html": "<h1>Hi John!</h1>\n", "subject": "Full", "to": "john.doe@johndoe.com"});
			});
		});

		it("should render the 'hu-HU' localized template", () => {
			service.send.mockClear();

			return broker.call("mail.send", {
				template: "full",
				locale: "hu-HU",
				subject: "Fallback subject",
				to: "john.doe@johndoe.com",
				data: {
					name: "John"
				}
			}).then(() => {
				expect(service.send).toHaveBeenCalledTimes(1);
				expect(service.send).toHaveBeenCalledWith({"html": "<h1 style=\"color: red;\">Szia John!</h1>\n", "subject": "Üdvözlünk, John!\n", "text": "Szia John!\n", "to": "john.doe@johndoe.com"});
			});
		});


		it("should render default template if localization is not exist", () => {
			service.send.mockClear();

			return broker.call("mail.send", {
				template: "full",
				locale: "fr-FR",
				subject: "Full",
				to: "john.doe@johndoe.com",
				data: {
					name: "John"
				}
			}).then(() => {
				expect(service.send).toHaveBeenCalledTimes(1);
				expect(service.send).toHaveBeenCalledWith({"html": "<h1>Hi John!</h1>\n", "subject": "Full", "to": "john.doe@johndoe.com"});
			});
		});

		it("should reject if template is not exist", () => {
			service.send.mockClear();

			return broker.call("mail.send", {
				template: "nothing",
				subject: "Full",
				to: "john.doe@johndoe.com",
				data: {
					name: "John"
				}
			}).then(() => {
				expect(true).toBe(false);
			}).catch(err => {
				expect(err.message).toBe("Missing e-mail template: nothing");
				expect(service.send).toHaveBeenCalledTimes(0);
			});
		});

	});


	describe("should render templates with global data", () => {
		let broker, service;
		let spySend = jest.fn(() => Promise.resolve());
		beforeEach(() => {
			broker = new ServiceBroker({ logger: false});
			service = broker.createService(MailService, { settings: {
				transport: { type: "sendmail" },
				templateFolder: __dirname + "/templates",
				data: {
					siteName: "My App"
				}
			} });
			service.send = spySend;

			return broker.start();
		});

		afterEach(() => broker.stop());

		it("should render default template without localization", () => {
			service.send.mockClear();

			return broker.call("mail.send", {
				template: "data",
				subject: "Data",
				to: "john.doe@johndoe.com",
				data: {
					name: "John"
				}
			}).then(() => {
				expect(service.send).toHaveBeenCalledTimes(1);
				expect(service.send).toHaveBeenCalledWith({"html": "<h1>Hi John on My App!</h1>\n", "subject": "Data", "to": "john.doe@johndoe.com"});
			});
		});

	});

});

