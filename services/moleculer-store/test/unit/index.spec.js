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
		adapter,
	});

	it("should called the 'init' method of adapter", () => {
		expect(adapter.init).toHaveBeenCalledTimes(1);
		expect(adapter.init).toHaveBeenCalledWith(broker, service);
	});

	it("should call the 'connect' method", () => {
		service.connect = jest.fn(() => Promise.resolve());

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
	const docs = [];
	const doc = { id : 1 };

	const adapter = {
		init: jest.fn(() => Promise.resolve()),
		connect: jest.fn(() => Promise.resolve()),
		disconnect: jest.fn(() => Promise.resolve()),
		findAll: jest.fn(() => Promise.resolve(docs)),
		findById: jest.fn(() => Promise.resolve(doc)),
		findByIds: jest.fn(() => Promise.resolve(docs)),
		count: jest.fn(() => Promise.resolve(3)),
		insert: jest.fn(() => Promise.resolve(doc)),
		insertMany: jest.fn(() => Promise.resolve(docs)),
		update: jest.fn(() => Promise.resolve(docs)),
		updateById: jest.fn(() => Promise.resolve(doc)),
		remove: jest.fn(() => Promise.resolve(3)),
		removeById: jest.fn(() => Promise.resolve(3)),
		clear: jest.fn(() => Promise.resolve(3))
	};

	const afterConnected = jest.fn();

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter,
		afterConnected
	});

	it("should call 'afterConnected' of schema", () => {
		return broker.start().delay(100).then(() => {
			expect(afterConnected).toHaveBeenCalledTimes(1);
			expect(adapter.connect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call broker.emit to clear the cache", () => {
		broker.emit = jest.fn();

		return service.clearCache().then(() => {
			expect(broker.emit).toHaveBeenCalledTimes(1);
			expect(broker.emit).toHaveBeenCalledWith("cache.clean", "store.*");
		}).catch(protectReject);
	});

	it("should call 'findAll' of adapter", () => {
		const ctx = { params: {} };
		service.transformDocuments = jest.fn((ctx, docs) => Promise.resolve(docs));

		return service.find(ctx).then(res => {
			expect(res).toBe(docs);

			expect(adapter.findAll).toHaveBeenCalledTimes(1);
			expect(adapter.findAll).toHaveBeenCalledWith(ctx.params);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(ctx, docs);
		}).catch(protectReject);
	});

	it("should call 'count' of adapter", () => {
		const ctx = { params: {} };

		return service.count(ctx).then(res => {
			expect(res).toBe(3);
			
			expect(adapter.count).toHaveBeenCalledTimes(1);
			expect(adapter.count).toHaveBeenCalledWith(ctx.params);
		}).catch(protectReject);
	});

	it("should call 'insert' of adapter", () => {
		const ctx = { params: { entity: {} } };
		service.transformDocuments.mockClear();
		service.clearCache = jest.fn(() => Promise.resolve());

		return service.create(ctx).then(res => {
			expect(res).toBe(doc);

			expect(adapter.insert).toHaveBeenCalledTimes(1);
			expect(adapter.insert).toHaveBeenCalledWith(ctx.params.entity);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(ctx, doc);

			expect(service.clearCache).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call 'findById' of adapter", () => {
		const ctx = { params: { id: 5 } };
		service.transformDocuments.mockClear();

		return service.get(ctx).then(res => {
			expect(res).toBe(doc);

			expect(adapter.findById).toHaveBeenCalledTimes(1);
			expect(adapter.findById).toHaveBeenCalledWith(ctx.params.id);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(ctx, doc);

		}).catch(protectReject);
	});

	
	describe("Test `this.model` method", () => {
		service.toFilteredJSON = jest.fn(doc => Promise.resolve(doc));
		service.populateDocs = jest.fn((ctx, docs) => Promise.resolve(docs));

		it("call with one ID", () => {
			adapter.findById.mockClear();
			const ctx = { params: { id: 5 } };

			return service.model(ctx).then(res => {
				expect(res).toBe(doc);

				expect(adapter.findById).toHaveBeenCalledTimes(1);
				expect(adapter.findById).toHaveBeenCalledWith(ctx.params.id);

				expect(service.toFilteredJSON).toHaveBeenCalledTimes(1);
				expect(service.toFilteredJSON).toHaveBeenCalledWith(doc, undefined);

				expect(service.populateDocs).toHaveBeenCalledTimes(0);
				//expect(service.populateDocs).toHaveBeenCalledWith(ctx, doc);

			}).catch(protectReject);
		});

		it("call with multi IDs", () => {
			adapter.findByIds.mockClear();
			service.toFilteredJSON.mockClear();
			const ctx = { params: { id: [5, 3, 8], fields: false, populate: true } };

			return service.model(ctx).then(res => {
				expect(res).toBe(docs);

				expect(adapter.findByIds).toHaveBeenCalledTimes(1);
				expect(adapter.findByIds).toHaveBeenCalledWith(ctx.params.id);

				expect(service.toFilteredJSON).toHaveBeenCalledTimes(0);

				expect(service.populateDocs).toHaveBeenCalledTimes(1);
				expect(service.populateDocs).toHaveBeenCalledWith(ctx, docs);

			}).catch(protectReject);
		});

		it("call with multi IDs, and should convert the result to object", () => {
			adapter.findByIds.mockClear();
			service.toFilteredJSON.mockClear();
			service.populateDocs.mockClear();
			const ctx = { params: { id: [5, 3, 8], fields: false, resultAsObject: true } };

			adapter.findByIds = jest.fn(() => Promise.resolve([
				{ _id: 5, name: "John" },
				{ _id: 3, name: "Walter" },
				{ _id: 8, name: "Jane" }
			]));

			return service.model(ctx).then(res => {
				expect(res).toEqual({
					"3": {
						"_id": 3,
						"name": "Walter"
					},
					"5": {
						"_id": 5,
						"name": "John"
					},
					"8": {
						"_id": 8,
						"name": "Jane"
					}
				});

				expect(adapter.findByIds).toHaveBeenCalledTimes(1);
				expect(adapter.findByIds).toHaveBeenCalledWith(ctx.params.id);

				expect(service.toFilteredJSON).toHaveBeenCalledTimes(0);
				expect(service.populateDocs).toHaveBeenCalledTimes(0);

			}).catch(protectReject);
		});

	});
	

	it("should call 'updateById' of adapter", () => {
		const ctx = { params: { id: 5, update: {} } };
		service.transformDocuments.mockClear();
		service.clearCache.mockClear();

		return service.update(ctx).then(res => {
			expect(res).toBe(doc);

			expect(adapter.updateById).toHaveBeenCalledTimes(1);
			expect(adapter.updateById).toHaveBeenCalledWith(ctx.params.id, ctx.params.update);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(ctx, doc);

			expect(service.clearCache).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call 'removeById' of adapter", () => {
		const ctx = { params: { id: 5 } };
		service.transformDocuments.mockClear();
		service.clearCache.mockClear();

		return service.remove(ctx).then(res => {
			expect(res).toBe(3);

			expect(adapter.removeById).toHaveBeenCalledTimes(1);
			expect(adapter.removeById).toHaveBeenCalledWith(ctx.params.id);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(ctx, 3);

			expect(service.clearCache).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call 'clear' of adapter", () => {
		const ctx = {};
		service.clearCache.mockClear();

		return service.clear(ctx).then(res => {
			expect(res).toBe(3);

			expect(adapter.clear).toHaveBeenCalledTimes(1);
			expect(service.clearCache).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call 'disconnect' of adapter", () => {
		return broker.stop().delay(100).then(() => {
			expect(adapter.disconnect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});	
});

const mockAdapter = {
	init: jest.fn(() => Promise.resolve()),
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(() => Promise.resolve())
};

describe("Test transformDocuments method", () => {
	const docs = [];
	const doc = { id : 1 };

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter: mockAdapter
	});

	service.populateDocs = jest.fn((ctx, docs) => Promise.resolve(docs));
	service.toFilteredJSON = jest.fn(docs => Promise.resolve(docs));

	it("should call 'populateDocs' & toFilteredJSON methods", () => {
		const ctx = { params: {} };
		return service.transformDocuments(ctx, doc).then(() => {
			expect(service.populateDocs).toHaveBeenCalledTimes(1);
			expect(service.populateDocs).toHaveBeenCalledWith(ctx, doc);

			expect(service.toFilteredJSON).toHaveBeenCalledTimes(1);
			expect(service.toFilteredJSON).toHaveBeenCalledWith(doc, undefined);
		}).catch(protectReject);
	});

	it("should not call 'populateDocs' but toFilteredJSON methods", () => {
		service.populateDocs.mockClear();
		service.toFilteredJSON.mockClear();
		
		const ctx = { params: { populate: false, fields: "name" } };
		return service.transformDocuments(ctx, doc).then(() => {
			expect(service.populateDocs).toHaveBeenCalledTimes(0);

			expect(service.toFilteredJSON).toHaveBeenCalledTimes(1);
			expect(service.toFilteredJSON).toHaveBeenCalledWith(doc, "name");
		}).catch(protectReject);
	});

});

describe("Test convertToJSON method", () => {
	const doc = { 
		id : 1,
		name: "Walter",
		address: {
			city: "Albuquerque",
			state: "NM",			
			zip: 87111
		}
	};

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter: mockAdapter
	});

	it("should not touch the doc", () => {
		const res = service.convertToJSON(doc);
		expect(res).toBe(doc);
	});

	it("should filter the fields", () => {
		const res = service.convertToJSON(doc, ["name", "address"]);
		expect(res).toEqual({
			name: "Walter",
			address: doc.address
		});
	});

	it("should filter with nested fields", () => {
		const res = service.convertToJSON(doc, ["name", "address.city", "address.zip"]);
		expect(res).toEqual({
			name: "Walter",
			address: {
				city: "Albuquerque",
				zip: 87111
			}
		});
	});

	it("should call toJSON if the doc is a Model", () => {
		doc.toJSON = jest.fn(() => doc);
		const res = service.convertToJSON(doc, ["name"]);
		expect(res).toEqual({
			name: "Walter"
		});
		expect(doc.toJSON).toHaveBeenCalledTimes(1);
	});

});

describe("Test toFilteredJSON method", () => {
	const docs = [{ id: 1 }, { id: 2 }, { id: 3 }];
	const doc = { id : 1 };

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter: mockAdapter,
		settings: {
			fields: "id name status"
		}
	});

	service.convertToJSON = jest.fn(docs => docs);

	it("should call 'convertToJSON' with object", () => {
		service.toFilteredJSON(doc);
		expect(service.convertToJSON).toHaveBeenCalledTimes(1);
		expect(service.convertToJSON).toHaveBeenCalledWith(doc, ["id", "name", "status"]);
	});

	it("should call 'convertToJSON' with array", () => {
		service.convertToJSON.mockClear();

		service.toFilteredJSON(docs, ["name", "email"]);
		expect(service.convertToJSON).toHaveBeenCalledTimes(3);
		expect(service.convertToJSON).toHaveBeenCalledWith(docs[0], ["name", "email"]);
		expect(service.convertToJSON).toHaveBeenCalledWith(docs[1], ["name", "email"]);
		expect(service.convertToJSON).toHaveBeenCalledWith(docs[2], ["name", "email"]);
	});

});


describe("Test populateDocs method", () => {
	const docs = [{ id: 1, author: 3 }, { id: 2, author: 5, comments: [8, 3, 8] }, { id: 3, author: 8 }];
	const doc = { id : 1 };

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(StoreService, {
		name: "store",
		adapter: mockAdapter,
		settings: {
			populates: {
				"comments": "comments.model",
				"author": {
					action: "users.model",
					populate: true,
					params: {
						fields: "username fullName"
					}
				}
			}
		}
	});

	it("should call 'populateDocs' with rules from settings", () => {
		const ctx = { params: {} };
		ctx.call = jest.fn(() => Promise.resolve({
			"3": {
				"fullName": "Walter"
			},
			"5": {
				"fullName": "John"
			},
			"8": {
				"fullName": "Jane"
			}
		})).mockImplementationOnce(() => Promise.resolve({
			"8": { id: 8, title: "Lorem" },
			"3": { id: 3, title: "ipsum" }
		}));

		return service.populateDocs(ctx, docs).then(res => {
			expect(ctx.call).toHaveBeenCalledTimes(2);
			expect(ctx.call).toHaveBeenCalledWith("users.model", {
				fields: "username fullName",
				id: [3, 5, 8],
				populate: true,
				resultAsObject: true
			});
			expect(ctx.call).toHaveBeenCalledWith("comments.model", {
				id: [8, 3],
				populate: false,
				resultAsObject: true
			});

			expect(res).toEqual([
				{
					"author": {
						"fullName": "Walter"
					},
					"comments": undefined,
					"id": 1
				},
				{
					"author": {
						"fullName": "John"
					},
					"comments": [
						{
							"id": 8,
							"title": "Lorem"
						},
						{
							"id": 3,
							"title": "ipsum"
						},
						{
							"id": 8,
							"title": "Lorem"
						}
					],
					"id": 2
				},
				{
					"author": {
						"fullName": "Jane"
					},
					"comments": undefined,
					"id": 3
				}
			]);

		}).catch(protectReject);
	});

	it("should call 'populateDocs' with one doc & custom rules & rule handler", () => {
		const ctx = { params: {} };
		const doc = {
			id: 1,
			author: 8
		};

		const rules = {
			author: jest.fn(ids => {
				return { 
					"8": { name: "Adams" } 
				};
			})
		};

		return service.populateDocs(ctx, doc, rules).then(res => {
			expect(rules.author).toHaveBeenCalledTimes(1);
			expect(rules.author).toHaveBeenCalledWith([8], { field: "author", handler: jasmine.any(Function) }, ctx);

			expect(res).toEqual({
				id: 1,
				author: {
					name: "Adams"
				}
			});

		}).catch(protectReject);
	});

	it("should call 'populateDocs' with multiple doc & custom rules & rule handler", () => {
		const ctx = { params: {} };
		const docs = [
			{ author: 8 },
			{ author: 2 },
			{ author: 10 },
			{ author: 1 }
		];

		const rules = {
			author: jest.fn(ids => {
				return { 
					"1": { name: "John" } ,
					"2": { name: "Walter" },
					"8": { name: "Adams" } 
				};
			})
		};

		return service.populateDocs(ctx, docs, rules).then(res => {
			expect(rules.author).toHaveBeenCalledTimes(1);
			expect(rules.author).toHaveBeenCalledWith([8, 2, 10, 1], { field: "author", handler: jasmine.any(Function) }, ctx);

			expect(res).toEqual([
				{ author: { name: "Adams" } },
				{ author: { name: "Walter" } },
				{ author: undefined },
				{ author: { name: "John" } },
			]);

		}).catch(protectReject);
	});

	it("should return docs if not population rules", () => {
		const docs = [];
		const ctx = { params: {} };

		return service.populateDocs(ctx, docs).then(res => {
			expect(res).toBe(docs);

		}).catch(protectReject);
	});

});