"use strict";

jest.mock("nodemailer");
jest.mock("email-templates");
const path = require("path");
const nodemailer = require("nodemailer");

const { ServiceBroker } = require("moleculer");
const MailService = require("../../src");

describe("Test MailService", () => {

	describe("Test created", () => {

		it("should be created without transport", () => {
			const broker = new ServiceBroker({ logger: false });
			const service = broker.createService(MailService);
			expect(service).toBeDefined();
			expect(service.transporter).toBeUndefined();
		});

		it("should be created with transport", () => {
			const fakeTransporter = {};
			nodemailer.createTransport = jest.fn(() => fakeTransporter);

			const broker = new ServiceBroker({ logger: false });
			const service = broker.createService(MailService, {
				settings: {
					transport: {
						a: 5,
					},
				},
			});

			expect(service).toBeDefined();
			expect(service.transporter).toBe(fakeTransporter);

			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith(service.settings.transport);
		});

		it("should be created with transport from templates config", () => {
			const fakeTransporter = {};
			nodemailer.createTransport = jest.fn(() => fakeTransporter);

			const broker = new ServiceBroker({ logger: false });
			const service = broker.createService(MailService, {
				settings: {
					template: {
						transport: 5,
					},
				},
			});

			expect(service).toBeDefined();
			expect(service.transporter).toBe(fakeTransporter);

			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith(service.settings.template.transport);
		});


		it("should be created and call createTransport", () => {
			nodemailer.createTransport.mockClear();

			const fakeTransporter = {};
			const createTransport = jest.fn(() => fakeTransporter);

			const broker = new ServiceBroker({ logger: false });
			const service = broker.createService(MailService, {
				methods: {
					createTransport,
				},
			});

			expect(service).toBeDefined();
			expect(service.transporter).toBe(fakeTransporter);

			expect(createTransport).toHaveBeenCalledTimes(1);
			expect(createTransport).toHaveBeenCalledWith();
		});

	});

	describe("Test send", () => {
		const spySendMail = jest.fn((msg) => Promise.resolve(msg));

		let broker, service;
		beforeEach(() => {
			broker = new ServiceBroker({ logger: false });
			service = broker.createService(MailService);
			service.emailTemplate = {
				send: spySendMail,
			};
			service.transporter = {
				sendMail: jest.fn(),
			};

			return broker.start();
		});

		afterEach(() => broker.stop());

		it("should call Email.send", () => {
			const params = {
				message: {
					to: "john.doe@gmail.com",
				},
			};

			return broker.call("mail.send", params).then(res => {
				expect(res).toEqual(params);
				expect(spySendMail).toHaveBeenCalledTimes(1);
				expect(spySendMail).toHaveBeenCalledWith(res);
			});

		});

		it("should reject the request", () => {
			spySendMail.mockClear();
			service.emailTemplate = {
				send: jest.fn(() => Promise.reject(new Error("Invalid format!"))),
			};

			const params = {
				message: {
					to: "john.doe@gmail.com",
				},
			};

			return expect(broker.call("mail.send", params)).rejects.toBeInstanceOf(Error);
		});

		it("should reject because there is no transporter", () => {
			spySendMail.mockClear();
			service.transporter = null;

			const params = {
				message: {
					to: "john.doe@gmail.com",
				},
			};

			return expect(broker.call("mail.send", params)).rejects.toBeInstanceOf(Error);
		});

	});

	describe("Test sanitize", () => {
		let broker, service;
		beforeEach(() => {
			broker = new ServiceBroker({ logger: false });
			service = broker.createService(MailService);
			service.transporter = {
				sendMail: jest.fn(),
			};

			return broker.start();
		});

		afterEach(() => broker.stop());

		it("should not change a correct message", () => {
			const params = {
				message: {
					to: "john.doe@gmail.com",
				},
				template: "full",
				locals: {
					name: "Elon",
				},
			};

			const res = service.sanitize(params);

			expect(res).toEqual(params);
		});

		it("should move all nodemailer fields", () => {
			const params = {
				to: "john.doe@gmail.com",
				cc: "john.doe@gmail.com",
				template: "full",
				locals: {
					name: "Elon",
				},
			};

			const res = service.sanitize(params);

			expect(res).toEqual({
				message: {
					to: "john.doe@gmail.com",
					cc: "john.doe@gmail.com",
				},
				template: "full",
				locals: {
					name: "Elon",
				},
			});
		});

		it("should use correct localized template", () => {
			const params = {
				to: "john.doe@gmail.com",
				cc: "john.doe@gmail.com",
				template: "full",
				locals: {
					locale: "fr",
					name: "Elon",
				},
			};

			const res = service.sanitize(params);

			expect(res).toEqual({
				message: {
					to: "john.doe@gmail.com",
					cc: "john.doe@gmail.com",
				},
				template: path.join("full", "fr"),
				locals: {
					name: "Elon",
				},
			});
		});
	});
});

