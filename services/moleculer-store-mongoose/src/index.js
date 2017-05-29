/*
 * moleculer-store-mongoose
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 		= require("lodash");
const Promise	= require("bluebird");
const mongoose = require("mongoose");
//const ObjectId = require("mongoose").Types.ObjectId;

class MongooseStoreAdapter {

	constructor(opts) {
		this.opts = opts;
		mongoose.Promise = Promise;
	}

	init(broker, service) {
		this.broker = broker;
		this.service = service;

		this.collection = this.service.collection;
	}

	connect() {
		let uri, opts;
		if (_.isObject(this.settings.db) && this.settings.db.uri != null) {
			uri = this.settings.db.uri;
			opts = this.settings.db.opts;
		} else {
			uri = this.settings.db;
		}

		const conn = mongoose.connect(uri, opts);
		return conn.then(() => {
			this.db = conn.connection;

			this.db.on("disconnected", function mongoDisconnected() {
				this.service.logger.warn("Disconnected from MongoDB.");
			}.bind(this));
		});	
	}

	disconnect() {
		if (this.db) {
			this.db.close();
		}
		return Promise.resolve();
	}

	findAll(params) {
		return this.doFiltering(params).lean().exec();
	}

	findById(_id) {
		return this.collection.findById(_id).lean().exec();
	}

	findByIds(ids) {
		return this.collection.find({
			_id: {
				$in: ids
			}
		}).lean().exec();
	}

	count(params = {}) {
		return this.doFiltering(params).count();
	}

	insert(entity) {
		const item = new this.collection(entity);
		return item.save();
	}

	insertMany(entities) {
		return this.collection.insertMany(entities);
	}

	update(params) {
		return this.collection.update(params.query, params.update, { multi: true, "new": true }).then(res => res.map(doc => doc.toJSON()));
	}

	updateById(_id, update) {
		return this.collection.findByIdAndUpdate(_id, update, { "new": true }).then(res => res.toJSON());
	}

	remove(params) {
		return this.collection.remove(params.query);
	}

	removeById(_id) {
		return this.collection.findByIdAndRemove(_id);
	}

	clear() {
		return this.collection.remove({});
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
	 * @returns {MongoQuery}
	 */
	doFiltering(params) {
		const q = this.collection.find(params.query);
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

			// Offset
			if (_.isNumber(params.offset) && params.offset > 0)
				q.skip(params.offset);

			// Limit
			if (_.isNumber(params.limit) && params.limit > 0)
				q.limit(params.limit);
		}
		return q;
	}

}

module.exports = MongooseStoreAdapter;
