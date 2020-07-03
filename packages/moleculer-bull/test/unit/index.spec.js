"use strict";

jest.mock("bull");

let processCB = jest.fn();
let addCB = jest.fn().mockImplementation(() => {
	return Promise.resolve({ id: "id" });
});
let addDelayedCB = jest.fn();

let Queue = require("bull");

Queue.mockImplementation(() => ({
	process: processCB,
	add: addCB,
}));

const { ServiceBroker } = require("moleculer");
const BullService = require("../../src");


describe("Test BullService constructor", () => {
	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService(BullService());

	it("should be created", () => {
		expect(service).toBeDefined();
		expect(service.$queues).toBeDefined();
	});

});

describe("Test BullService started handler", () => {
	const opts = { a: 5 };
	const url = "redis://localhost";

	const concurrency = {
		concurrency: 100,
		process: jest.fn(),
	};
	const named = {
		name: "name",
		process: jest.fn(),
	};
	
	const namedWithOptions = {
		name: "name",
		process: jest.fn(),
		options: {
			prefix: "moleculer"
		}
	};

	const multipleNamed = [
		{
			name: "name1",
			process: jest.fn(),
		},
		{
			name: "name2",
			process: jest.fn(),
		}
	];

	const namedconcurrency = {
		name: "name",
		concurrency: 100,
		process: jest.fn(),
	};

	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService({
		mixins: [BullService(url, opts)],

		queues: {
			"task.first": jest.fn(),
			"task.second": jest.fn(),
			"task.concurrency": concurrency,
			"task.name": named,
			"task.namedWithOptions": namedWithOptions,
			"task.name.multiple": multipleNamed,
			"task.name.concurrency": namedconcurrency,
		}
	});

	beforeAll(() => service._start());

	it("should be created queues", () => {
		expect(service).toBeDefined();
		expect(Object.keys(service.$queues).length).toBe(7);

		expect(service.$queues["task.first"]).toBeDefined();
		expect(service.$queues["task.second"]).toBeDefined();
		expect(service.$queues["task.concurrency"]).toBeDefined();
		expect(service.$queues["task.name"]).toBeDefined();
		expect(service.$queues["task.namedWithOptions"]).toBeDefined();
		expect(service.$queues["task.name.multiple"]).toBeDefined();
		expect(service.$queues["task.name.concurrency"]).toBeDefined();

		expect(Queue).toHaveBeenCalledTimes(7);
		expect(Queue).toHaveBeenCalledWith("task.first", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.second", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.concurrency", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.name", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.namedWithOptions", url, namedWithOptions.options);
		expect(Queue).toHaveBeenCalledWith("task.name.multiple", url, opts);
		expect(Queue).toHaveBeenCalledWith("task.name.concurrency", url, opts);

		expect(processCB).toHaveBeenCalledTimes(8);
		expect(processCB).toHaveBeenCalledWith(expect.anything());
		expect(processCB).toHaveBeenCalledWith(expect.anything());
		expect(processCB).toHaveBeenCalledWith(concurrency.concurrency, expect.anything());
		expect(processCB).toHaveBeenCalledWith(named.name, expect.anything());
		expect(processCB).toHaveBeenCalledWith(namedWithOptions.name, expect.anything());
		expect(processCB).toHaveBeenCalledWith(multipleNamed[0].name, expect.anything());
		expect(processCB).toHaveBeenCalledWith(multipleNamed[1].name, expect.anything());
		expect(processCB).toHaveBeenCalledWith(namedconcurrency.name, namedconcurrency.concurrency, expect.anything());
	});

	it("should return defined queues", () => {
		expect(service.getQueue("task.first")).toBeDefined();
		expect(service.getQueue("task.second")).toBeDefined();
		expect(service.getQueue("task.concurrency")).toBeDefined();
		expect(service.getQueue("task.name")).toBeDefined();
		expect(service.getQueue("task.namedWithOptions")).toBeDefined();
		expect(service.getQueue("task.name.multiple")).toBeDefined();
		expect(service.getQueue("task.name.concurrency")).toBeDefined();
	});

});


describe("Test BullService getQueue when creating a job", () => {
	const payload = { a: 10 };

	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService({
		mixins: [BullService()]
	});

	it("should call getQueue", () => {
		service.getQueue = jest.fn(() => ({ add: addCB }));

		service.createJob("task.first", payload);

		expect(service.getQueue).toHaveBeenCalledTimes(1);
		expect(service.getQueue).toHaveBeenCalledWith("task.first");

		expect(addCB).toHaveBeenCalledTimes(1);
		expect(addCB).toHaveBeenCalledWith(payload);
	});

});

describe("Test BullService job with named queue", () => {
	const payload = { a: 10 };
	const jobOpts = { a: 1 };
	const namedAdd = jest.fn();
	const name = "named";

	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService({
		mixins: [BullService()]
	});

	it("should be able to add a named job", () => {
		service.getQueue = jest.fn(() => ({ add: namedAdd }));

		service.createJob("task.scheduled", name, payload, jobOpts);

		expect(service.getQueue).toHaveBeenCalledTimes(1);
		expect(service.getQueue).toHaveBeenCalledWith("task.scheduled");

		expect(namedAdd).toHaveBeenCalledTimes(1);
		expect(namedAdd).toHaveBeenCalledWith("named", payload, jobOpts);
	});

});


describe("Test BullService job with delay", () => {
	const payload = { a: 10 };
	const jobOpts = { delay: 1000, a:1 };
	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService({
		mixins: [BullService()]
	});

	it("should be able to add a job with delay options", () => {
		service.getQueue = jest.fn(() => ({ add: addDelayedCB }));

		service.createJob("task.scheduled", payload, jobOpts);

		expect(service.getQueue).toHaveBeenCalledTimes(1);
		expect(service.getQueue).toHaveBeenCalledWith("task.scheduled");

		expect(addDelayedCB).toHaveBeenCalledTimes(1);
		expect(addDelayedCB).toHaveBeenCalledWith(payload, jobOpts);
	});

});


describe("Test BullService createJob return a promise", () => {
	const payload = { a: 10 };
	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService({
		mixins: [BullService()]
	});

	let processCB = jest.fn();
	let addCB = jest.fn().mockImplementation(() => {
		return Promise.resolve({ id: "id"});
	});

	it("should be able to add a job", () => {
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

describe("Test BullService createJob return a promise", () => {
	const payload = { a: 10 };
	const broker = new ServiceBroker({ logger: false});
	const service = broker.createService({
		mixins: [BullService()],
		queues: undefined
	});

	it("should be able to add a job", () => {
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
				expect(Queue).toHaveBeenCalledTimes(8);
				expect(Queue).toHaveBeenCalledWith("task.scheduled", undefined, undefined);

				expect(job).toBeDefined();
				expect(job.id).toBeDefined();
			});
	});

});