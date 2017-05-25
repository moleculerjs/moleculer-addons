"use strict";

const { ServiceBroker } = require("moleculer");
const MailService = require("../../src");
const _ = require("lodash");

jest.mock("nodemailer");
jest.mock("nodemailer-mailgun-transport");
jest.mock("nodemailer-sendgrid-transport");

describe("Test MailService", () => {

	it("should be created", () => {
		const broker = new ServiceBroker();
		const service = broker.createService(MailService);
		expect(service).toBeDefined();
	});

	describe("should call getTransporter at created", () => {
		let broker, svc, spyUse;
		beforeEach(() => {
			broker = new ServiceBroker();
			svc = _.cloneDeep(MailService);
			spyUse = jest.fn();
			svc.methods.getTransporter = jest.fn(() => ({
				use: spyUse
			}));
		});

		it("should call spyUse", () => {
			broker.createService(svc);

			expect(svc.methods.getTransporter).toHaveBeenCalledTimes(0);
			expect(spyUse).toHaveBeenCalledTimes(0);
		});

		it("should call spyUse", () => {
			broker.createService(svc, {
				settings: {
					transport: {
						type: "sendmail"
					}
				}
			});

			expect(svc.methods.getTransporter).toHaveBeenCalledTimes(1);
			expect(spyUse).toHaveBeenCalledTimes(1);
		});

		it("should call spyUse", () => {
			broker.createService(svc, {
				settings: {
					transport: {
						type: "sendmail"
					},
					htmlToText: false
				}
			});

			expect(svc.methods.getTransporter).toHaveBeenCalledTimes(1);
			expect(spyUse).toHaveBeenCalledTimes(0);
		});
	});

	describe("Test getTransporter", () => {
		const nodemailer = require("nodemailer");

		let broker, svc;
		beforeEach(() => {
			broker = new ServiceBroker();
			svc = _.cloneDeep(MailService);
		});

		it("should call createTransport with default", () => {
			nodemailer.createTransport.mockClear();
			broker.createService(svc);

			expect(nodemailer.createTransport).toHaveBeenCalledTimes(0);
		});

		it("should call createTransport for 'sendmail'", () => {
			nodemailer.createTransport.mockClear();
			broker.createService(svc, {
				settings: {
					transport: {
						type: "sendmail",
						options: {
							sendmail: true,
							newline: "unix",
							path: "/usr/bin/sendmail"
						}
					}
				}
			});

			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith( {
				sendmail: true,
				newline: "unix",
				path: "/usr/bin/sendmail"
			});
		});

		it("should call createTransport for 'smtp'", () => {
			nodemailer.createTransport.mockClear();
			broker.createService(svc, {
				settings: {
					transport: {
						type: "smtp",
						options: {
							host: "smtp.server.org"
						}
					}
				}
			});

			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				host: "smtp.server.org"
			});
		});

		it("should call createTransport for 'mailgun'", () => {
			const mg = require("nodemailer-mailgun-transport");
			mg.mockImplementation(opts => opts);

			nodemailer.createTransport.mockClear();
			broker.createService(svc, {
				settings: {
					transport: {
						type: "mailgun",
						options: {
							api_key: "123456"
						}
					}
				}
			});

			expect(mg).toHaveBeenCalledTimes(1);
			expect(mg).toHaveBeenCalledWith({
				api_key: "123456"
			});
			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				api_key: "123456"
			});
		});

		it("should call createTransport for 'sendgrid'", () => {
			const mg = require("nodemailer-sendgrid-transport");
			mg.mockImplementation(opts => opts);

			nodemailer.createTransport.mockClear();
			broker.createService(svc, {
				settings: {
					transport: {
						type: "sendgrid",
						options: {
							api_key: "123456"
						}
					}
				}
			});

			expect(mg).toHaveBeenCalledTimes(1);
			expect(mg).toHaveBeenCalledWith({
				api_key: "123456"
			});
			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				api_key: "123456"
			});
		});

	});

	describe("Test send", () => {
		const spySendMail = jest.fn((msg, cb) => cb(null, msg));

		let broker, svc;
		beforeEach(() => {
			broker = new ServiceBroker();
			svc = _.cloneDeep(MailService);
		});

		it("should call nodemailer.sendMail", () => {
			const service = broker.createService(svc);
			service.transporter = {
				sendMail: spySendMail
			};

			const params = {
				to: "john.doe@gmail.com"
			};

			return broker.call("mail.send", params).then(res => {
				expect(res).toBe(params);
				expect(res.from).toBe("moleculer@company.net");
				expect(spySendMail).toHaveBeenCalledTimes(1);
				expect(spySendMail).toHaveBeenCalledWith(params, jasmine.any(Function));
			});

		});

		it("should call nodemailer.sendMail & set from", () => {
			spySendMail.mockClear();
			const service = broker.createService(svc);
			service.transporter = {
				sendMail: spySendMail
			};

			const params = {
				from: "boss@company.net",
				to: "john.doe@gmail.com"
			};

			return broker.call("mail.send", params).then(res => {
				expect(res).toBe(params);
				expect(res.from).toBe("boss@company.net");
				expect(spySendMail).toHaveBeenCalledTimes(1);
				expect(spySendMail).toHaveBeenCalledWith(params, jasmine.any(Function));
			});

		});

		it("should reject the request", () => {
			spySendMail.mockClear();
			const service = broker.createService(svc);
			service.transporter = {
				sendMail: jest.fn((msg, cb) => cb(new Error("Invalid format!")))
			};

			const params = {
				to: "john.doe@gmail.com"
			};

			return expect(broker.call("mail.send", params)).rejects.toBeInstanceOf(Error);
		});

		it("should reject because there is no transporter", () => {
			spySendMail.mockClear();
			const service = broker.createService(svc);

			const params = {
				to: "john.doe@gmail.com"
			};

			return expect(broker.call("mail.send", params)).rejects.toBeInstanceOf(Error);
		});

	});


});

