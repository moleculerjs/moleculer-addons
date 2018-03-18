"use strict";

jest.mock("bull");

let processCB = jest.fn();
let addCB = jest.fn();
let addDelayedCB = jest.fn();

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
			"task.concurrency": {
				concurrency: 100,
				process(job) {
					return jest.fn();
				},
			},
		}
	});

	it("should be created queues", () => {
		expect(service).toBeDefined();
		expect(Object.keys(service.$queues).length).toBe(3);
		expect(service.$queues["task.first"]).toBeDefined();
		expect(service.$queues["task.second"]).toBeDefined();
		expect(service.$queues["task.concurrency"]).toBeDefined();

		expect(Queue).toHaveBeenCalledTimes(3);
		expect(Queue).toHaveBeenCalledWith("task.first", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.second", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.concurrency", url, opts);

		expect(processCB).toHaveBeenCalledTimes(3);
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


describe("Test BullService job with delay", () => {
	const payload = { a: 10 };
	const jobOpts = { delay: 1000, a:1 };
	const broker = new ServiceBroker();
	const service = broker.createService({
		mixins: [BullService()]
	});

	it("should be able to add a job with delay options", () => {
		service.getQueue = jest.fn(() => ({ add: addDelayedCB }));

		service.createJob("task.scheduled", payload, jobOpts);

		expect(service.getQueue).toHaveBeenCalledTimes(1);
		expect(service.getQueue).toHaveBeenCalledWith("task.scheduled");

		setTimeout(() => {
			expect(addDelayedCB).toHaveBeenCalledTimes(1);
			expect(addDelayedCB).toHaveBeenCalledWith(payload, jobOpts);
		},1001);
	});

});



describe("Test BullService createJob return a promise", () => {
	const payload = { a: 10 };
	const broker = new ServiceBroker();
	const service = broker.createService({
		mixins: [BullService()]
	});

	let processCB = jest.fn();
	let addCB = jest.fn().mockImplementation(() => {
		return Promise.resolve({ id: "id"});
	});


	let Queue = require("bull");
	Queue.mockImplementation(() => ({
		process: processCB,
		add: addCB
	}));


	it("should be able to add a job with delay options", () => {
		service.getQueue = jest.fn(() => ({ add: addCB }));

		function promisedFunction (queue, payload) {
			return new Promise((resolve, reject) => {
				service.createJob(queue, payload)
					.then(data => {
						resolve(data);
					}).catch(err => {
						reject(err);
					});
			});
		}

		return promisedFunction("task.scheduled", payload)
			.then(job => {
				expect(service.getQueue).toHaveBeenCalledTimes(1);
				expect(service.getQueue).toHaveBeenCalledWith("task.scheduled");

				expect(addCB).toHaveBeenCalledTimes(1);
				expect(addCB).toHaveBeenCalledWith(payload);

				expect(job).toBeDefined();
				expect(job.id).toBeDefined();
			});



	});

});

