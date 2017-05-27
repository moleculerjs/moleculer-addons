"use strict";

const { ServiceBroker } = require("moleculer");
const Adapter = require("../../src/adapter");

describe("Test Adapter constructor", () => {
	it("should be created", () => {
		const adapter = new Adapter();
		expect(adapter).toBeDefined();
	});
});

describe("Test Adapter constructor", () => {
	const broker = new ServiceBroker();
	const service = broker.createService({
		name: "test"
	});

	const adapter = new Adapter();
	adapter.init(broker, service);

	it("should connect", () => {
		return expect(adapter.connect()).resolves.toBeUndefined();
	});

	const doc = {
		a: 5,
		b: "Hello",
		c: true,
		d: null
	};

	let savedDoc;

	it("should insert a document", () => {
		return adapter.insert(doc)
		.then(res => {
			expect(res).toEqual(Object.assign({}, doc, { _id: jasmine.any(String) }));
			savedDoc = res;
		}).catch(err => expect(err).toBe(true));
	});

	let multipleDocs;
	it("should insert multiple document", () => {
		return adapter.insert([{ name: "John", c: true }, { name: "Jane", b: "Hello" }])
		.then(res => {
			expect(res.length).toBe(2);
			expect(res[0]._id).toBeDefined();
			expect(res[0].name).toBe("John");

			expect(res[1]._id).toBeDefined();
			expect(res[1].name).toBe("Jane");

			multipleDocs = res;
		}).catch(err => expect(err).toBe(true));
	});

	it("should find by ID", () => {
		return expect(adapter.findById(savedDoc._id)).resolves.toEqual(savedDoc);
	});

	it("should find by multiple ID", () => {
		return expect(adapter.findByIds([multipleDocs[0]._id, multipleDocs[1]._id, ])).resolves.toEqual(multipleDocs);
	});

	it("should find all 'name'", () => {
		return expect(adapter.findAll({ where: { name: "John" }})).resolves.toEqual([multipleDocs[0]]);
	});

	it("should find all 'b'", () => {
		// random order return expect(adapter.findAll({ where: { b: "Hello" }})).resolves.toEqual([savedDoc, multipleDocs[1]]);
	});

	it("should count all entities", () => {
		return expect(adapter.count()).resolves.toBe(3);
	});

	it("should count filtered entities", () => {
		return expect(adapter.count({ where: { name: { $exists: true } }})).resolves.toBe(2);
	});

	it("should update a document", () => {
		return expect(adapter.updateById(savedDoc._id, { $set: { e: 1234 } })).resolves.toBe(1);
	});	

	it("should update many documents", () => {
		return expect(adapter.update({
			query: { b: "Hello" }, 
			update: { $set: { f: "World" } }
		})).resolves.toBe(2);
	});	

	it("should remove by ID", () => {
		return expect(adapter.removeById(multipleDocs[0]._id)).resolves.toBe(1);
	});	

	it("should remove many documents", () => {
		return expect(adapter.remove({
			query: { b: "Hello" }
		})).resolves.toBe(2);
	});	


	it("should insert multiple document (for clear)", () => {
		return adapter.insert([{ name: "John", c: true }, { name: "Jane", b: "Hello" }]);
	});

	it("should count all entities", () => {
		return expect(adapter.count()).resolves.toBe(2);
	});	

	it("should clear all documents", () => {
		return expect(adapter.clear()).resolves.toBe(2);
	});	
});
