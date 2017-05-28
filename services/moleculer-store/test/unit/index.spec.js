"use strict";

const { ServiceBroker, Context } = require("moleculer");
const StoreService = require("../../src");

function protectReject(err) {
	expect(err).toBe(true);
}

describe("Test StoreService actions", () => {
	const adapter = {
		init: jest.fn()
	};

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter
	});

	it("should called the 'init' method of adapter", () => {
		expect(adapter.init).toHaveBeenCalledTimes(1);
		expect(adapter.init).toHaveBeenCalledWith(broker, service);
	});

	it("should call the 'connect' method", () => {
		service.connect = jest.fn();

		return broker.start().then(() => {
			expect(service.connect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call the 'find' method", () => {
		service.find = jest.fn();

		return broker.call("store.find").then(() => {
			expect(service.find).toHaveBeenCalledTimes(1);
			expect(service.find).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'count' method", () => {
		service.count = jest.fn();

		return broker.call("store.count").then(() => {
			expect(service.count).toHaveBeenCalledTimes(1);
			expect(service.count).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'create' method", () => {
		service.create = jest.fn();

		return broker.call("store.create").then(() => {
			expect(service.create).toHaveBeenCalledTimes(1);
			expect(service.create).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'get' method", () => {
		service.get = jest.fn();

		return broker.call("store.get").then(() => {
			expect(service.get).toHaveBeenCalledTimes(1);
			expect(service.get).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'model' method", () => {
		service.model = jest.fn();

		return broker.call("store.model").then(() => {
			expect(service.model).toHaveBeenCalledTimes(1);
			expect(service.model).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'update' method", () => {
		service.update = jest.fn();

		return broker.call("store.update").then(() => {
			expect(service.update).toHaveBeenCalledTimes(1);
			expect(service.update).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'remove' method", () => {
		service.remove = jest.fn();

		return broker.call("store.remove").then(() => {
			expect(service.remove).toHaveBeenCalledTimes(1);
			expect(service.remove).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'clear' method", () => {
		service.clear = jest.fn();

		return broker.call("store.clear").then(() => {
			expect(service.clear).toHaveBeenCalledTimes(1);
			expect(service.clear).toHaveBeenCalledWith(jasmine.any(Context));
		}).catch(protectReject);
	});


	it("should call the 'disconnect' method", () => {
		service.disconnect = jest.fn();

		return broker.stop().then(() => {
			expect(service.disconnect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});
});


describe("Test StoreService methods", () => {
	const adapter = {
		init: jest.fn(),
		connect: jest.fn(),
		disconnect: jest.fn(),
		findAll: jest.fn(),
		findById: jest.fn(),
		findByIds: jest.fn(),
		count: jest.fn(),
		insert: jest.fn(),
		insertMany: jest.fn(),
		update: jest.fn(),
		updateById: jest.fn(),
		remove: jest.fn(),
		removeById: jest.fn(),
		clear: jest.fn()
	};

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter
	});

	/*
		connect
		disconnect
		find
		count
		create
		get
		model
		update
		remove
		clear
		clearCache
		transformDocuments
		toFilteredJSON
		convertToJSON
		populateDocs
	*/
});