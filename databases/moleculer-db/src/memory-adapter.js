/*
 * moleculer-db
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 		= require("lodash");
const Promise	= require("bluebird");
const Datastore = require("nedb");

class MemoryDbAdapter {

	constructor(opts) {
		this.opts = opts;
	}

	init(broker, service) {
		this.broker = broker;
		this.service = service;
	}

	connect() {
		this.db = new Datastore(this.opts); // in-memory

		["loadDatabase", "insert", "findOne", "count", "remove", "ensureIndex", "removeIndex"].forEach(method => {
			this.db[method] = Promise.promisify(this.db[method]);
		});
		["update"].forEach(method => {
			this.db[method] = Promise.promisify(this.db[method], { multiArgs: true });
		});

		return this.db.loadDatabase();
	}

	disconnect() {
		this.db = null;
		return Promise.resolve();
	}

	findAll(params) {
		return new Promise((resolve, reject) => {
			this.doFiltering(params).exec((err, docs) => {
				/* istanbul ignore next */
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
				/* istanbul ignore next */
				if (err)
					return reject(err);

				resolve(docs);
			});

		});
	}

	count(params = {}) {
		return new Promise((resolve, reject) => {
			this.doFiltering(params).exec((err, docs) => {
				/* istanbul ignore next */
				if (err)
					return reject(err);

				resolve(docs.length);
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
		return this.db.update(params.query, params.update, { multi: true, returnUpdatedDocs: true }).then(res => res[1]);
	}

	updateById(_id, update) {
		return this.db.update({ _id }, update, { returnUpdatedDocs: true }).then(res => res[1]);
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
	 * @param {Object} params 
	 * @returns {Query}
	 */
	doFiltering(params) {
		if (params) {
			let q;

			// Text search
			if (_.isString(params.search) && params.search !== "") {
				let fields = [];
				if (params.searchFields) {
					fields = _.isString(params.searchFields) ? params.searchFields.split(" ") : params.searchFields;
				}

				q = this.db.find({ 
					$where: function() {
						let item = this;
						if (fields.length > 0)
							item = _.pick(this, fields);

						const res = _.values(item).find(v => String(v).toLowerCase().indexOf(params.search.toLowerCase()) !== -1);

						return res != null;
					}
				});
			} else {
				if (params.query) 
					q = this.db.find(params.query);
				else
					q = this.db.find({});
			}

			// Sort
			if (params.sort) {
				let sort = params.sort;
				if (_.isString(params.sort))
					sort = params.sort.replace(/,/, " ").split(" ");
				
				const sortFields = {};
				sort.forEach(field => {
					if (field.startsWith("-"))
						sortFields[field.slice(1)] = -1;
					else 
						sortFields[field] = 1;
				});
				q.sort(sortFields);
			}

			// Limit
			if (_.isNumber(params.limit) && params.limit > 0)
				q.limit(params.limit);

			// Offset
			if (_.isNumber(params.offset) && params.offset > 0)
				q.skip(params.offset);

			return q;
		}

		return this.db.find({});
	}
}

module.exports = MemoryDbAdapter;
