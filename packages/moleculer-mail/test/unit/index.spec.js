"use strict";

jest.mock("nodemailer");
const nodemailer = require("nodemailer");

const { ServiceBroker } = require("moleculer");
const MailService = require("../../src");
const _ = require("lodash");

describe("Test MailService", () => {

	describe("Test created", () => {

		it("should be created without transport", () => {
			const broker = new ServiceBroker({ logger: false});
			const service = broker.createService(MailService);
			expect(service).toBeDefined();
			expect(service.transporter).toBeUndefined();
		});

		it("should be created with transport", () => {
			const fakeTransporter = {
				use: jest.fn()
			};
			nodemailer.createTransport = jest.fn(() => fakeTransporter);
			const broker = new ServiceBroker({ logger: false});
			const service = broker.createService(MailService, {
				settings: {
					transport: {
						a: 5
					}
				}
			});

			expect(service).toBeDefined();
			expect(service.transporter).toBe(fakeTransporter);

			expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
			expect(nodemailer.createTransport).toHaveBeenCalledWith(service.settings.transport);

			expect(fakeTransporter.use).toHaveBeenCalledTimes(1);
			expect(fakeTransporter.use).toHaveBeenCalledWith("compile", jasmine.any(Function));
		});


		it("should be created and call createTransport", () => {
			nodemailer.createTransport.mockClear();

			const fakeTransporter = {
				use: jest.fn()
			};
			const createTransport = jest.fn(() => fakeTransporter);

			const broker = new ServiceBroker({ logger: false});
			const service = broker.createService(MailService, {
				methods: {
					createTransport
				}
			});

			expect(service).toBeDefined();
			expect(service.transporter).toBe(fakeTransporter);

			expect(createTransport).toHaveBeenCalledTimes(1);
			expect(createTransport).toHaveBeenCalledWith();

			expect(fakeTransporter.use).toHaveBeenCalledTimes(1);
			expect(fakeTransporter.use).toHaveBeenCalledWith("compile", jasmine.any(Function));
		});

	});

	describe("Test send", () => {
		const spySendMail = jest.fn((msg, cb) => cb(null, msg));

		let broker, service;
		beforeEach(() => {
			broker = new ServiceBroker({ logger: false});
			const svc = _.cloneDeep(MailService);

			service = broker.createService(svc, {
				settings: {
					from: "moleculer@company.net"
				}
			});
			service.transporter = {
				sendMail: spySendMail
			};

			return broker.start();
		});

		afterEach(() => broker.stop());

		it("should call nodemailer.sendMail", () => {
			const params = {
				to: "john.doe@gmail.com"
			};

			return broker.call("mail.send", params).then(res => {
				expect(res).toEqual({
					from: "moleculer@company.net",
					to: "john.doe@gmail.com"
				});
				expect(spySendMail).toHaveBeenCalledTimes(1);
				expect(spySendMail).toHaveBeenCalledWith(res, jasmine.any(Function));
			});

		});

		it("should call nodemailer.sendMail & set from", () => {
			spySendMail.mockClear();
			const params = {
				from: "boss@company.net",
				to: "john.doe@gmail.com"
			};

			return broker.call("mail.send", params).then(res => {
				expect(res).toEqual(params);
				expect(res.from).toBe("boss@company.net");
				expect(spySendMail).toHaveBeenCalledTimes(1);
				expect(spySendMail).toHaveBeenCalledWith(params, jasmine.any(Function));
			});

		});

		it("should reject the request", () => {
			spySendMail.mockClear();
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
			service.transporter = null;

			const params = {
				to: "john.doe@gmail.com"
			};

			return expect(broker.call("mail.send", params)).rejects.toBeInstanceOf(Error);
		});

	});


});

