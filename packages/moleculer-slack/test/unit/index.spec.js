"use strict";

process.env.SLACK_TOKEN = "12345";
process.env.SLACK_CHANNEL = "abcdef";

const { ServiceBroker } = require("moleculer");
const { MoleculerError } = require("moleculer").Errors;



jest.mock("@slack/client");

const { WebClient } = require('@slack/client');

WebClient.mockImplementation(() => {
	return {
		chat: {
			postMessage: jest.fn().mockImplementationOnce(() => Promise.resolve({
				ts: "111"
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

const SlackService = require("../../src");

describe("Test SlackService", () => {
	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService(SlackService);

	it("should be created", () => {
		expect(service).toBeDefined();
	});

	it("should create Slack client instance", () => {
		return broker.start().catch(protectReject).then(() => {
			expect(service.client).toBeDefined();
			expect(WebClient).toHaveBeenCalledTimes(1);
			expect(WebClient).toHaveBeenCalledWith(process.env.SLACK_TOKEN);
		});
	});

	it("should call client.chat.postMessage", () => {
		return service.sendMessage("Hello world").catch(protectReject).then(res => {
			expect(res).toEqual({
				ts: "111"
			});
			expect(service.client.chat.postMessage).toHaveBeenCalledTimes(1);
			expect(service.client.chat.postMessage).toHaveBeenCalledWith({
				channel: process.env.SLACK_CHANNEL,
				text: "Hello world",
			});
		});
	});

	it("should call client.messages.create and return with error", () => {
		return service.sendMessage().then(protectReject).catch(err => {
			expect(err).toBeInstanceOf(MoleculerError);
			expect(err.message).toBe("errMessage errDetail");
			expect(err.code).toBe(500);
			expect(err.type).toBe("POSTMESSAGE_ERROR");
		});
	});

	it("should call the sendMessage method successfully", () => {
		let message = {
			sid: "12345"
		};
		service.sendMessage = jest.fn(() => Promise.resolve(message));

		return broker.call("slack.send", {message: "Test Slack"}).catch(protectReject).then(res => {
			expect(res).toBe(message);
			expect(service.sendMessage).toHaveBeenCalledTimes(1);
			expect(service.sendMessage).toHaveBeenCalledWith("Test Slack", undefined);

			return broker.stop();
		});
	});

	it("should call the sendMessage method successfully with channel", () => {
		let message = {
			sid: "12345"
		};
		service.sendMessage = jest.fn(() => Promise.resolve(message));

		return broker.call("slack.send", { message: "Test Slack", channel: "some-topic" }).catch(protectReject).then(res => {
			expect(res).toBe(message);
			expect(service.sendMessage).toHaveBeenCalledTimes(1);
			expect(service.sendMessage).toHaveBeenCalledWith("Test Slack", "some-topic");

			return broker.stop();
		});
	});

	it("should call the sendMessage method successfully with channel and thread_ts", () => {
		let message = {
			sid: "12345"
		};
		service.sendMessage = jest.fn(() => Promise.resolve(message));

		return broker.call("slack.send", { message: "Test Slack", channel: "some-topic" , ts: "some-thread"}).catch(protectReject).then(res => {
			expect(res).toBe(message);
			expect(service.sendMessage).toHaveBeenCalledTimes(1);
			expect(service.sendMessage).toHaveBeenCalledWith("Test Slack", "some-topic", "some-thread");

			return broker.stop();
		});
	});

});

