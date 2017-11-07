"use strict";

const { ServiceBroker } = require("moleculer");
const MailService = require("../../src");
const _ = require("lodash");

describe("Test MailService", () => {

	it("should be created", () => {
		const broker = new ServiceBroker();
		const service = broker.createService(MailService);
		expect(service).toBeDefined();
	});

	describe("Test send", () => {
		const spySendMail = jest.fn((msg, cb) => cb(null, msg));

		let broker, svc;
		beforeEach(() => {
			broker = new ServiceBroker();
			svc = _.cloneDeep(MailService);
		});

		it("should call nodemailer.sendMail", () => {
			const service = broker.createService(svc, {
				settings: {
					from: "moleculer@company.net"
				}
			});
			service.transporter = {
				sendMail: spySendMail
			};

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
			const service = broker.createService(svc);
			service.transporter = {
				sendMail: spySendMail
			};

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
			broker.createService(svc);

			const params = {
				to: "john.doe@gmail.com"
			};

			return expect(broker.call("mail.send", params)).rejects.toBeInstanceOf(Error);
		});

	});


});

