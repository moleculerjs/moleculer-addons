/*
 * moleculer-store
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 		= require("lodash");
const Promise	= require("bluebird");
const Datastore = require("nedb");

class MemoryStoreAdapter {

	constructor(opts) {
		this.opts = opts;
	}

	init(broker, service) {
		this.broker = broker;
		this.service = service;
		this.Promise = broker.Promise;
	}

	connect() {
		this.db = new Datastore(); // in-memory

		["insert", "findOne", "count", "update", "remove", "ensureIndex", "removeIndex"].forEach(method => {
			this.db[method] = Promise.promisify(this.db[method]);
		});
		return Promise.resolve();
	}

	disconnect() {
		this.db.close(); //?
		return Promise.resolve;
	}

	findAll(params) {
		return new Promise((resolve, reject) => {
			const q = this.db.find(params.where);
			this.applyFilters(q, params).exec((err, docs) => {
				if (err)
					return reject(err);

				resolve(docs);
			});

		});
	}

	findById(_id) {
		return this.db.findOne({ _id });
	}

	findByIds(ids) {
		return new Promise((resolve, reject) => {
			this.db.find({ _id: { $in: ids } }).exec((err, docs) => {
				if (err)
					return reject(err);

				resolve(docs);
			});

		});
	}

	count(params = {}) {
		return new Promise((resolve, reject) => {
			this.db.count(params.where, (err, count) => {
				if (err)
					return reject(err);

				resolve(count);
			});

		});
	}

	insert(entity) {
		return this.db.insert(entity);
	}

	insertMany(entities) {
		return this.db.insert(entities);
	}

	update(params) {
		return this.db.update(params.query, params.update, { multi: true });
	}

	updateById(_id, update) {
		return this.db.update({ _id }, update);
	}

	remove(params) {
		return this.db.remove(params.query, { multi: true });
	}

	removeById(_id) {
		return this.db.remove({ _id });
	}

	clear() {
		return this.db.remove({}, { multi: true });
	}

	/**
	 * Add filters to query
	 * Available filters: 
	 *  - search
	 * 	- sort
	 * 	- limit
	 * 	- offset
	 * 
	 * @param {MongoQuery} q 
	 * @param {Object} params 
	 * @returns {MongoQuery}
	 */
	applyFilters(q, params) {
		if (params) {
			// Full-text search
			// More info: https://docs.mongodb.com/manual/reference/operator/query/text/
			if (_.isString(params.search) && params.search !== "") {
				q.find({
					$text: {
						$search: params.search
					}
				});
				q._fields = {
					_score: {
						$meta: "textScore"
					}
				};
				q.sort({
					_score: {
						$meta: "textScore"
					}
				});
			} else {
				// Sort
				if (_.isString(params.sort))
					q.sort(params.sort.replace(/,/, " "));
				else if (Array.isArray(params.sort))
					q.sort(params.sort.join(" "));					
			}

			// Limit
			if (_.isNumber(params.limit) && params.limit > 0)
				q.limit(params.limit);

			// Offset
			if (_.isNumber(params.offset) && params.offset > 0)
				q.skip(params.offset);
		}
		return q;
	}
}

module.exports = MemoryStoreAdapter;
