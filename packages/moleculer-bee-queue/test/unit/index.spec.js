"use strict";

jest.mock("bee-queue");

let processCB = jest.fn();
let createJobCB = jest.fn();

let Queue = require("bee-queue");
Queue.mockImplementation(() => ({
	process: processCB,
	createJob: createJobCB
}));

const { ServiceBroker } = require("moleculer");
const BeeService = require("../../src");

describe("Test BeeService constructor", () => {
	const broker = new ServiceBroker();
	const service = broker.createService(BeeService());

	it("should be created", () => {
		expect(service).toBeDefined();
		expect(service.$queues).toBeDefined();
	});

});

describe("Test BeeService created handler", () => {
	const opts = { a: 5 };

	const broker = new ServiceBroker();
	const service = broker.createService({
		mixins: [BeeService(opts)],

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
		expect(Queue).toHaveBeenCalledWith("task.first", opts);
		expect(Queue).toHaveBeenCalledWith("task.second", opts);

		expect(processCB).toHaveBeenCalledTimes(2);
	});

});

describe("Test BeeService created handler", () => {
	const payload = { a: 10 };

	const broker = new ServiceBroker();
	const service = broker.createService({
		mixins: [BeeService()]
	});

	it("should be call getQueue", () => {
		service.getQueue = jest.fn(() => ({ createJob: createJobCB }));

		service.createJob("task.first", payload);

		expect(service.getQueue).toHaveBeenCalledTimes(1);
		expect(service.getQueue).toHaveBeenCalledWith("task.first");

		expect(createJobCB).toHaveBeenCalledTimes(1);
		expect(createJobCB).toHaveBeenCalledWith(payload);
	});

});


