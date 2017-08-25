"use strict";

jest.mock("bull");

let processCB = jest.fn();
let addCB = jest.fn();

let Queue = require("bull");
Queue.mockImplementation(() => ({
	process: processCB,
	add: addCB
}));

const { ServiceBroker } = require("moleculer");
const BullService = require("../../src");

describe("Test BullService constructor", () => {
	const broker = new ServiceBroker();
	const service = broker.createService(BullService());

	it("should be created", () => {
		expect(service).toBeDefined();
		expect(service.$queues).toBeDefined();
	});

});

describe("Test BullService created handler", () => {
	const opts = { a: 5 };
	const url = "redis://localhost";

	const broker = new ServiceBroker();
	const service = broker.createService({
		mixins: [BullService(url, opts)],

		queues: {
			"task.first": jest.fn(),
			"task.second": jest.fn(),
		}
	});

	it("should be created queues", () => {
		expect(service).toBeDefined();
		expect(Object.keys(service.$queues).length).toBe(2);
		expect(service.$queues["task.first"]).toBeDefined();
		expect(service.$queues["task.second"]).toBeDefined();

		expect(Queue).toHaveBeenCalledTimes(2);
		expect(Queue).toHaveBeenCalledWith("task.first", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.second", url, opts);

		expect(processCB).toHaveBeenCalledTimes(2);
	});

});

describe("Test BullService created handler", () => {
	const payload = { a: 10 };

	const broker = new ServiceBroker();
	const service = broker.createService({
		mixins: [BullService()]
	});

	it("should be call getQueue", () => {
		service.getQueue = jest.fn(() => ({ add: addCB }));

		service.createJob("task.first", payload);

		expect(service.getQueue).toHaveBeenCalledTimes(1);
		expect(service.getQueue).toHaveBeenCalledWith("task.first");

		expect(addCB).toHaveBeenCalledTimes(1);
		expect(addCB).toHaveBeenCalledWith(payload);
	});

});


