"use strict";

jest.mock("graphile-worker", () => {
	const originalModule = jest.requireActual("graphile-worker");

	return {
		...originalModule,
		run: jest.fn(),
		quickAddJob: jest.fn(),
		makeWorkerUtils: jest.fn(),
	};
});

const { ServiceBroker } = require("moleculer");
const PsqlQueueService = require("../../src");

const {
	run,
	quickAddJob,
	makeWorkerUtils,
	Logger,
} = require("graphile-worker");

const addJobMock = jest.fn();
makeWorkerUtils.mockImplementation(() => ({
	addJob: addJobMock,
	release: jest.fn(),
}));

const promiseMock = jest.fn();
const eventListenerMock = jest.fn();

run.mockImplementation(() => {
	return {
		events: {
			on: eventListenerMock,
		},
		promise: promiseMock,
	};
});

const CONNECTION_URL = "postgres://localhost:5444/task_queue";

describe("Test PsqlQueueService constructor", () => {
	const broker = new ServiceBroker({ logger: false });
	const service = broker.createService(PsqlQueueService(CONNECTION_URL));

	it("should be created", () => {
		expect(service).toBeDefined();

		expect(service.initLogger).toBeDefined();
		expect(service.createJob).toBeDefined();
	});
});

describe("Test PsqlQueueService started handler", () => {
	const queueOpts = {};
	const producerOpts = {};

	const named = {
		name: "name",
		process: jest.fn(),
	};

	const broker = new ServiceBroker({ logger: false });
	describe("Test without queue", () => {
		const service = broker.createService({
			mixins: [PsqlQueueService(CONNECTION_URL, queueOpts, producerOpts)],
		});

		beforeAll(() => service._start());
		afterAll(() => service._stop());

		it("should be init producer and consumer to be defined", () => {
			expect(service.producer).toBeDefined();
			expect(service.consumer).toBeUndefined();
		});
	});

	describe("Test with queue", () => {
		const service = broker.createService({
			mixins: [PsqlQueueService(CONNECTION_URL, queueOpts, producerOpts)],

			queues: {
				"task.first": jest.fn(),
				"task.name": named,
			},
		});

		const initLoggerSpy = jest.spyOn(service, "initLogger");

		beforeAll(() => service._start());

		it("should be init producer and consumer to be defined", () => {
			expect(service.producer).toBeDefined();
			expect(service.consumer).toBeDefined();
			expect(initLoggerSpy).toHaveBeenCalled();
		});
	});

	describe("Test with event listeners", () => {
		const service = broker.createService({
			mixins: [PsqlQueueService(CONNECTION_URL, queueOpts, producerOpts)],

			queues: {
				"task.first": jest.fn(),
				"task.name": named,
			},

			settings: {
				jobEventHandlers: {
					"job:success": jest.fn(),
				},
			},
		});

		beforeAll(() => service._start());

		it("should be init producer and consumer to be defined", () => {
			expect(service.producer).toBeDefined();
			expect(service.consumer).toBeDefined();
			expect(service.consumer.events.on).toHaveBeenLastCalledWith(
				"job:success",
				expect.any(Function)
			);
		});
	});
});
