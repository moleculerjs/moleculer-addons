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

const { run, makeWorkerUtils } = require("graphile-worker");

const addJobMock = jest.fn();
makeWorkerUtils.mockImplementation(() => ({
	addJob: addJobMock,
	release: jest.fn(),
}));

const promiseMock = {
	then: jest.fn(),
	catch: jest.fn(),
};
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
		expect(service.$connectedToQueue).toBeDefined();
	});
});

describe("Test PsqlQueueService connection/reconnection logic", () => {
	const broker = new ServiceBroker({ logger: false });
	const service = broker.createService({
		mixins: [PsqlQueueService(CONNECTION_URL)],

		settings: {
			$queueReconnectionDelay: 0,
		},

		queues: {
			"task.first": jest.fn(),
		},
	});

	beforeEach(() => {
		// Disconnected by default
		service.$connectedToQueue = false;

		makeWorkerUtils.mockClear();
		run.mockClear();
	});

	it("should successfully connect to the queue", async () => {
		await service.connect();

		expect(service.$consumer).toBeDefined();
		expect(service.$producer).toBeDefined();

		expect(makeWorkerUtils).toBeCalledTimes(1);
		expect(run).toBeCalledTimes(1);
	});

	it("should fail to connect the 'producer' to the queue and retry with success", async () => {
		makeWorkerUtils
			.mockImplementationOnce(() => {
				throw new Error("Failed to connect to the queue");
			})
			.mockImplementationOnce(() => ({
				addJob: addJobMock,
				release: jest.fn(),
			}));

		await service.connect();

		await broker.Promise.delay(100);

		expect(makeWorkerUtils).toBeCalledTimes(2);
		expect(run).toBeCalledTimes(1);
	});

	it("should fail to connect the 'consumer' to the queue and retry with success", async () => {
		run.mockImplementationOnce(() => {
			throw new Error("Failed to connect to the queue");
		}).mockImplementationOnce(() => {
			return {
				events: {
					on: eventListenerMock,
				},
				promise: promiseMock,
			};
		});

		await service.connect();

		await broker.Promise.delay(100);

		expect(makeWorkerUtils).toBeCalledTimes(2);
		expect(run).toBeCalledTimes(2);
	});

	it("should successfully connect to the queue", async () => {
		run.mockImplementationOnce(() => {
			const p = new Promise((resolve, reject) => {
				setTimeout(() => {
					reject(new Error("Failed to connect to the queue"));
				}, 100);
			});

			return {
				events: {
					on: eventListenerMock,
				},
				// Mimic a failed connection after 100ms
				promise: p,
			};
		});

		await service._start();

		await broker.Promise.delay(300);

		expect(makeWorkerUtils).toBeCalledTimes(2);
		expect(run).toBeCalledTimes(2);
	});
});

describe("Test PsqlQueueService producer/consumer default initialization", () => {
	const queueOpts = {};
	const producerOpts = {};

	const named = {
		name: "name",
		process: jest.fn(),
	};

	const broker = new ServiceBroker({ logger: false });
	describe("Test without queue", () => {
		const service = broker.createService({
			mixins: [
				PsqlQueueService(CONNECTION_URL, { queueOpts, producerOpts }),
			],
		});

		beforeAll(() => service._start());
		afterAll(() => service._stop());

		it("should init producer", () => {
			expect(service.$producer).toBeDefined();
			expect(service.$consumer).toBeUndefined();
		});
	});

	describe("Test with queue", () => {
		const service = broker.createService({
			mixins: [
				PsqlQueueService(CONNECTION_URL, { queueOpts, producerOpts }),
			],

			queues: {
				"task.first": jest.fn(),
				"task.name": named,
			},
		});

		const initLoggerSpy = jest.spyOn(service, "initLogger");

		beforeAll(() => service._start());

		it("should init producer and consumer", () => {
			expect(service.$producer).toBeDefined();
			expect(service.$consumer).toBeDefined();
			expect(initLoggerSpy).toHaveBeenCalled();
		});
	});

	describe("Test with event listeners", () => {
		const service = broker.createService({
			mixins: [
				PsqlQueueService(CONNECTION_URL, { queueOpts, producerOpts }),
			],

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
			expect(service.$producer).toBeDefined();
			expect(service.$consumer).toBeDefined();
			expect(service.$consumer.events.on).toHaveBeenLastCalledWith(
				"job:success",
				expect.any(Function)
			);
		});
	});
});

describe("Test PsqlQueueService producer/consumer custom initialization", () => {
	const CUSTOM_SCHEMA_PROPERTY = "customQueues";
	const CUSTOM_CREATE_JOB_METHOD_NAME = "customCreateJob";
	const CUSTOM_PRODUCER_PROPERTY_NAME = "$customProducer";
	const CUSTOM_CONSUMER_PROPERTY_NAME = "$customConsumer";
	const CUSTOM_INTERNAL_QUEUE_NAME = "$customQueue";
	const CUSTOM_EVENT_HANDLERS_NAME = "customJobEventHandlers";

	const queueOpts = {};
	const producerOpts = {};

	const named = {
		name: "name",
		process: jest.fn(),
	};

	const broker = new ServiceBroker({ logger: false });
	describe("Test without queue", () => {
		const service = broker.createService({
			mixins: [
				PsqlQueueService(CONNECTION_URL, {
					schemaProperty: CUSTOM_SCHEMA_PROPERTY,
					createJobMethodName: CUSTOM_CREATE_JOB_METHOD_NAME,
					producerPropertyName: CUSTOM_PRODUCER_PROPERTY_NAME,
					consumerPropertyName: CUSTOM_CONSUMER_PROPERTY_NAME,
					internalQueueName: CUSTOM_INTERNAL_QUEUE_NAME,
					jobEventHandlersSettingsProperty:
						CUSTOM_EVENT_HANDLERS_NAME,
					queueOpts,
					producerOpts,
				}),
			],
		});

		beforeAll(() => service._start());
		afterAll(() => service._stop());

		it("should init producer", () => {
			expect(service.$customProducer).toBeDefined();
			expect(service.$customConsumer).toBeUndefined();
		});
	});

	describe("Test with queue", () => {
		const service = broker.createService({
			mixins: [
				PsqlQueueService(CONNECTION_URL, {
					schemaProperty: CUSTOM_SCHEMA_PROPERTY,
					createJobMethodName: CUSTOM_CREATE_JOB_METHOD_NAME,
					producerPropertyName: CUSTOM_PRODUCER_PROPERTY_NAME,
					consumerPropertyName: CUSTOM_CONSUMER_PROPERTY_NAME,
					internalQueueName: CUSTOM_INTERNAL_QUEUE_NAME,
					jobEventHandlersSettingsProperty:
						CUSTOM_EVENT_HANDLERS_NAME,
					queueOpts,
					producerOpts,
				}),
			],

			[CUSTOM_SCHEMA_PROPERTY]: {
				"task.first": jest.fn(),
				"task.name": named,
			},
		});

		const initLoggerSpy = jest.spyOn(service, "initLogger");

		beforeAll(() => service._start());

		it("should init producer and consumer", () => {
			expect(service.$customProducer).toBeDefined();
			expect(service.$customConsumer).toBeDefined();
			expect(initLoggerSpy).toHaveBeenCalled();
		});
	});

	describe("Test with event listeners", () => {
		const service = broker.createService({
			mixins: [
				PsqlQueueService(CONNECTION_URL, {
					schemaProperty: CUSTOM_SCHEMA_PROPERTY,
					createJobMethodName: CUSTOM_CREATE_JOB_METHOD_NAME,
					producerPropertyName: CUSTOM_PRODUCER_PROPERTY_NAME,
					consumerPropertyName: CUSTOM_CONSUMER_PROPERTY_NAME,
					internalQueueName: CUSTOM_INTERNAL_QUEUE_NAME,
					jobEventHandlersSettingsProperty:
						CUSTOM_EVENT_HANDLERS_NAME,
					queueOpts,
					producerOpts,
				}),
			],

			[CUSTOM_SCHEMA_PROPERTY]: {
				"task.first": jest.fn(),
				"task.name": named,
			},

			settings: {
				[CUSTOM_EVENT_HANDLERS_NAME]: {
					"job:success": jest.fn(),
				},
			},
		});

		beforeAll(() => service._start());

		it("should be init producer and consumer to be defined", () => {
			expect(service.$customProducer).toBeDefined();
			expect(service.$customConsumer).toBeDefined();
			expect(service.$customConsumer.events.on).toHaveBeenLastCalledWith(
				"job:success",
				expect.any(Function)
			);
		});
	});
});
