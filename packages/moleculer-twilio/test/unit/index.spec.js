"use strict";

process.env.TWILIO_ACCOUNT_SID = "12345";
process.env.TWILIO_AUTH_TOKEN = "abcdef";
process.env.TWILIO_PHONE_NUMBER = "123-456";

const { ServiceBroker } = require("moleculer");
const { MoleculerError } = require("moleculer").Errors;

jest.mock("twilio");

let Twilio = require("twilio");
Twilio.mockImplementation(() => {
	return {
		messages: {
			create: jest.fn().mockImplementationOnce(() => Promise.resolve({
				sid: "111"
			})).mockImplementation(() => Promise.reject({
				message: "errMessage",
				detail: "errDetail"
			}))
		}
	};
});

function protectReject(err) {
	console.error(err.stack);
	expect(err).toBe(true);
}

const SmsService = require("../../src");

describe("Test SmsService", () => {
	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService(SmsService);

	it("should be created", () => {
		expect(service).toBeDefined();
	});

	it("should create Twilio client instance", () => {
		return broker.start().catch(protectReject).then(() => {
			expect(service.client).toBeDefined();
			expect(Twilio).toHaveBeenCalledTimes(1);
			expect(Twilio).toHaveBeenCalledWith(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
		});
	});
	
	it("should call client.messages.create", () => {
		return service.sendSMS("555-1234", "Hello SMS!", "http://media.url").catch(protectReject).then(res => {
			expect(res).toEqual({
				sid: "111"
			});
			expect(service.client.messages.create).toHaveBeenCalledTimes(1);
			expect(service.client.messages.create).toHaveBeenCalledWith({
				from: "123-456",
				to: "555-1234",
				body: "Hello SMS!", 
				mediaUrl: "http://media.url"
			});
		});
	});
	
	it("should call client.messages.create and return with error", () => {
		return service.sendSMS("555-1122", "Test with error").then(protectReject).catch(err => {
			expect(err).toBeInstanceOf(MoleculerError);
			expect(err.message).toBe("errMessage errDetail");
			expect(err.code).toBe(500);
			expect(err.type).toBe("SMS_SEND_ERROR");
		});
	});	
	
	it("should call the sendSMS method successfully", () => {
		let sms = {
			sid: "12345"
		};
		service.sendSMS = jest.fn(() => Promise.resolve(sms));

		return broker.call("twilio.send", { to: "555-1122", message: "Test Twilio", mediaUrl: "https://unsplash.com" }).catch(protectReject).then(res => {
			expect(res).toBe(sms);
			expect(service.sendSMS).toHaveBeenCalledTimes(1);
			expect(service.sendSMS).toHaveBeenCalledWith("555-1122", "Test Twilio", "https://unsplash.com");

			return broker.stop();
		});
	});

});

