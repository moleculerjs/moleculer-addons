"use strict";

const { ServiceBroker } = require("moleculer");
const MongooseStoreAdapter = require("../../src");
const mongoose = require("mongoose");

function protectReject(err) {
	expect(err).toBe(true);
}

const doc = {
	toJSON: jest.fn()
};
const docs = [doc];

const execCB = jest.fn(() => Promise.resolve());
const saveCB = jest.fn(() => Promise.resolve());
const leanCB = jest.fn(() => ({ exec: execCB }));
const countCB = jest.fn(() => ({ exec: execCB }));
const query = jest.fn(() => ({ lean: leanCB, count: countCB }));

const fakeCollection = Object.assign(jest.fn(() => ({ save: saveCB })), {
	find: jest.fn(() => query()),
	findById: jest.fn(() => query()),
	insertMany: jest.fn(() => Promise.resolve()),
	update: jest.fn(() => Promise.resolve(docs)),
	findByIdAndUpdate: jest.fn(() => Promise.resolve(doc)),
	remove: jest.fn(() => Promise.resolve()),
	findByIdAndRemove: jest.fn(() => Promise.resolve()),
});


let fakeConn = Promise.resolve();
fakeConn.connection = {
	on: jest.fn(),
	close: jest.fn()
};

describe("Test MongooseStoreAdapter", () => {
	const broker = new ServiceBroker();
	const service = broker.createService({
		name: "store",
		collection: fakeCollection
	});

	const opts = {};
	const adapter = new MongooseStoreAdapter(opts);

	it("should be created", () => {
		expect(adapter).toBeDefined();
		expect(adapter.opts).toBe(opts);
		expect(adapter.init).toBeDefined();
		expect(adapter.connect).toBeDefined();
		expect(adapter.disconnect).toBeDefined();
		expect(adapter.findAll).toBeDefined();
		expect(adapter.findById).toBeDefined();
		expect(adapter.findByIds).toBeDefined();
		expect(adapter.count).toBeDefined();
		expect(adapter.insert).toBeDefined();
		expect(adapter.insertMany).toBeDefined();
		expect(adapter.update).toBeDefined();
		expect(adapter.updateById).toBeDefined();
		expect(adapter.remove).toBeDefined();
		expect(adapter.removeById).toBeDefined();
		expect(adapter.clear).toBeDefined();
	});

	it("call init", () => {
		adapter.init(broker, service);
		expect(adapter.broker).toBe(broker);
		expect(adapter.service).toBe(service);
		expect(adapter.collection).toBe(fakeCollection);
	});

	it("call connect with uri", () => {
		fakeConn.connection.on.mockClear();

		mongoose.connect = jest.fn(() => fakeConn);
		adapter.opts = "mongodb://server";
		return adapter.connect().catch(protectReject).then(() => {
			expect(mongoose.connect).toHaveBeenCalledTimes(1);
			expect(mongoose.connect).toHaveBeenCalledWith("mongodb://server", undefined);

			expect(adapter.db).toBe(fakeConn.connection);
			expect(adapter.db.on).toHaveBeenCalledTimes(1);
			expect(adapter.db.on).toHaveBeenCalledWith("disconnected", jasmine.any(Function));
		});
	});

	it("call connect with uri & opts", () => {
		fakeConn.connection.on.mockClear();

		mongoose.connect = jest.fn(() => fakeConn);
		adapter.opts = {
			uri: "mongodb://server",
			opts: {
				user: "admin",
				pass: "123456"
			}
		};

		return adapter.connect().catch(protectReject).then(() => {
			expect(mongoose.connect).toHaveBeenCalledTimes(1);
			expect(mongoose.connect).toHaveBeenCalledWith(adapter.opts.uri, adapter.opts.opts);
		});
	});

	it("call disconnect", () => {
		fakeConn.connection.close.mockClear();

		return adapter.disconnect().catch(protectReject).then(() => {
			expect(fakeConn.connection.close).toHaveBeenCalledTimes(1);
		});
	});


	describe("Test doFiltering", () => {
		it("init", () => {
			adapter.collection.find = jest.fn(() => ({
				find: jest.fn(),
				sort: jest.fn(),
				skip: jest.fn(),
				limit: jest.fn(),
				lean: leanCB, 
				count: countCB
			}));
		});

		it("call without params", () => {
			adapter.collection.find.mockClear();
			let q = adapter.doFiltering();
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith();
		});

		it("call with query", () => {
			adapter.collection.find.mockClear();
			let query = {};
			let q = adapter.doFiltering({ query });
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith(query);
		});

		it("call with sort string", () => {
			adapter.collection.find.mockClear();
			let query = {};
			let q = adapter.doFiltering({ query, sort: "-votes title" });
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith(query);
			
			expect(q.sort).toHaveBeenCalledTimes(1);
			expect(q.sort).toHaveBeenCalledWith("-votes title");
		});

		it("call with sort array", () => {
			adapter.collection.find.mockClear();
			let query = {};
			let q = adapter.doFiltering({ query, sort: ["createdAt", "title"] });
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith(query);
			
			expect(q.sort).toHaveBeenCalledTimes(1);
			expect(q.sort).toHaveBeenCalledWith("createdAt title");
		});

		it("call with limit & offset", () => {
			adapter.collection.find.mockClear();
			let q = adapter.doFiltering({ limit: 5, offset: 10 });
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith(undefined);
			
			expect(q.limit).toHaveBeenCalledTimes(1);
			expect(q.limit).toHaveBeenCalledWith(5);
			expect(q.skip).toHaveBeenCalledTimes(1);
			expect(q.skip).toHaveBeenCalledWith(10);
		});

		it("call with full-text search", () => {
			adapter.collection.find.mockClear();
			let q = adapter.doFiltering({ search: "walter" });
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith(undefined);
			
			expect(q.find).toHaveBeenCalledTimes(1);
			expect(q.find).toHaveBeenCalledWith({"$text": {"$search": "walter"}});
			expect(q.sort).toHaveBeenCalledTimes(1);
			expect(q.sort).toHaveBeenCalledWith({"_score": {"$meta": "textScore"}});
			expect(q._fields).toEqual({"_score": {"$meta": "textScore"}});
		});

	});


	it("call findAll", () => {
		adapter.doFiltering = jest.fn(() => query());

		let params = {};
		return adapter.findAll(params).catch(protectReject).then(() => {
			expect(adapter.doFiltering).toHaveBeenCalledTimes(1);
			expect(adapter.doFiltering).toHaveBeenCalledWith(params);

			expect(leanCB).toHaveBeenCalledTimes(1);
			expect(execCB).toHaveBeenCalledTimes(1);
		});
	});

	it("call findById", () => {
		leanCB.mockClear();
		execCB.mockClear();

		return adapter.findById(5).catch(protectReject).then(() => {
			expect(adapter.collection.findById).toHaveBeenCalledTimes(1);
			expect(adapter.collection.findById).toHaveBeenCalledWith(5);

			expect(leanCB).toHaveBeenCalledTimes(1);
			expect(execCB).toHaveBeenCalledTimes(1);
		});
	});

	it("call findByIds", () => {
		adapter.collection.find.mockClear();
		leanCB.mockClear();
		execCB.mockClear();

		return adapter.findByIds(5).catch(protectReject).then(() => {
			expect(adapter.collection.find).toHaveBeenCalledTimes(1);
			expect(adapter.collection.find).toHaveBeenCalledWith({"_id": {"$in": 5}});

			expect(leanCB).toHaveBeenCalledTimes(1);
			expect(execCB).toHaveBeenCalledTimes(1);
		});
	});

	it("call count", () => {
		adapter.doFiltering = jest.fn(() => query());
		leanCB.mockClear();
		execCB.mockClear();

		let params = {};
		return adapter.count(params).catch(protectReject).then(() => {
			expect(adapter.doFiltering).toHaveBeenCalledTimes(1);
			expect(adapter.doFiltering).toHaveBeenCalledWith(params);

			expect(countCB).toHaveBeenCalledTimes(1);
			expect(execCB).toHaveBeenCalledTimes(1);
		});
	});

	it("call insert", () => {
		let entity = {};
		return adapter.insert(entity).catch(protectReject).then(() => {
			expect(fakeCollection).toHaveBeenCalledTimes(1);
			expect(fakeCollection).toHaveBeenCalledWith(entity);

			expect(saveCB).toHaveBeenCalledTimes(1);
		});
	});


	it("call insertMany", () => {
		let entities = [];
		return adapter.insertMany(entities).catch(protectReject).then(() => {
			expect(adapter.collection.insertMany).toHaveBeenCalledTimes(1);
			expect(adapter.collection.insertMany).toHaveBeenCalledWith(entities);
		});
	});

	it("call update", () => {
		let params = {
			query: {},
			update: {}
		};
		return adapter.update(params).catch(protectReject).then(() => {
			expect(adapter.collection.update).toHaveBeenCalledTimes(1);
			expect(adapter.collection.update).toHaveBeenCalledWith(params.query, params.update, { multi: true, "new": true });

			expect(doc.toJSON).toHaveBeenCalledTimes(1);
		});
	});

	it("call updateById", () => {
		doc.toJSON.mockClear();

		let update = {};
		return adapter.updateById(5, update).catch(protectReject).then(() => {
			expect(adapter.collection.findByIdAndUpdate).toHaveBeenCalledTimes(1);
			expect(adapter.collection.findByIdAndUpdate).toHaveBeenCalledWith(5, update, { "new": true });

			expect(doc.toJSON).toHaveBeenCalledTimes(1);
		});
	});

	it("call remove", () => {
		let params = {
			query: {}
		};
		return adapter.remove(params).catch(protectReject).then(() => {
			expect(adapter.collection.remove).toHaveBeenCalledTimes(1);
			expect(adapter.collection.remove).toHaveBeenCalledWith(params.query);
		});
	});

	it("call removeById", () => {
		return adapter.removeById(5).catch(protectReject).then(() => {
			expect(adapter.collection.findByIdAndRemove).toHaveBeenCalledTimes(1);
			expect(adapter.collection.findByIdAndRemove).toHaveBeenCalledWith(5);
		});
	});	

	it("call clear", () => {
		adapter.collection.remove.mockClear();
		return adapter.clear().catch(protectReject).then(() => {
			expect(adapter.collection.remove).toHaveBeenCalledTimes(1);
			expect(adapter.collection.remove).toHaveBeenCalledWith({});
		});
	});	
});

