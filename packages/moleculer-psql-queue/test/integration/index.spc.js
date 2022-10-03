"use strict";

const { ServiceBroker } = require("moleculer");
const PsqlQueueService = require("../../src");

const broker = new ServiceBroker({ logger: false });

const CONNECTION_URL = "postgres://postgres:postgres@localhost:5444/task_queue";

describe("Test PsqlQueueService handlers", () => {
	const queueOpts = {};
	const producerOpts = {};

	const taskFirstHandler = jest.fn();
	const taskNameHandler = jest.fn();

	const service = broker.createService({
		mixins: [PsqlQueueService(CONNECTION_URL, queueOpts, producerOpts)],

		queues: {
			"task.first": () => {},
			"task.name": {
				process: () => {},
			},
		},
	});

	beforeAll(async () => {
		await broker.start();

		service.$queue["task.first"] = taskFirstHandler;
		service.$queue["task.name"] = taskNameHandler;
	});
	afterAll(() => broker.stop());

	beforeEach(() => {
		taskFirstHandler.mockClear();
		taskNameHandler.mockClear();
	});

	it('should call "task.first"', async () => {
		await service.createJob("task.first", { name: "task.first" });

		// Add a delay to wait for the job to be processed
		await broker.Promise.delay(1000);

		expect(taskFirstHandler).toHaveBeenCalledTimes(1);
		expect(taskFirstHandler).toHaveBeenCalledWith(
			{ name: "task.first" },
			expect.anything()
		);
	});

	it('should call "task.name"', async () => {
		await service.createJob("task.name", { name: "John" });

		// Add a delay to wait for the job to be processed
		await broker.Promise.delay(1000);

		expect(taskNameHandler).toHaveBeenCalledTimes(1);
		expect(taskNameHandler).toHaveBeenCalledWith(
			{ name: "John" },
			expect.anything()
		);
	});
});
