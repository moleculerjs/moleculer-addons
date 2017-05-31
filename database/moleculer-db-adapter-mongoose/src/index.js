/*
 * moleculer-db-adapter-mongoose
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 		= require("lodash");
const Promise	= require("bluebird");
const mongoose = require("mongoose");
//const ObjectId = require("mongoose").Types.ObjectId;

class MongooseStoreAdapter {

	/**
	 * Creates an instance of MongooseStoreAdapter.
	 * @param {any} opts 
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	constructor(opts) {
		this.opts = opts;
		mongoose.Promise = Promise;
	}

	/**
	 * Initialize adapter
	 * 
	 * @param {ServiceBroker} broker 
	 * @param {Service} service 
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	init(broker, service) {
		this.broker = broker;
		this.service = service;

		this.collection = this.service.schema.collection;
		if (!this.collection) {
			/* istanbul ignore next */
			throw new Error("Missing `collection` definition in schema of service!");
		}
	}

	/**
	 * Connect to database
	 * 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	connect() {
		let uri, opts;
		if (_.isObject(this.opts) && this.opts.uri != null) {
			uri = this.opts.uri;
			opts = this.opts.opts;
		} else {
			uri = this.opts;
		}

		/* istanbul ignore next */
		if (mongoose.connection.readyState != 0) {
			this.db = mongoose.connection;
			return Promise.resolve();
		}

		const conn = mongoose.connect(uri, opts);
		return conn.then(() => {
			this.db = conn.connection;

			this.db.on("disconnected", function mongoDisconnected() {
				/* istanbul ignore next */
				this.service.logger.warn("Disconnected from MongoDB.");
			}.bind(this));
		});	
	}

	/**
	 * Disconnect from database
	 * 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	disconnect() {
		if (this.db) {
			this.db.close();
		}
		return Promise.resolve();
	}

	/**
	 * Find all entities by `query`
	 * 
	 * @param {any} params 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	findAll(params) {
		return this.doFiltering(params).lean().exec();
	}

	/**
	 * Find an entities by ID
	 * 
	 * @param {any} _id 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	findById(_id) {
		return this.collection.findById(_id).lean().exec();
	}

	/**
	 * Find any entities by IDs
	 * 
	 * @param {Array} idList 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	findByIds(idList) {
		return this.collection.find({
			_id: {
				$in: idList
			}
		}).lean().exec();
	}

	/**
	 * Count of entities by params
	 * 
	 * @param {any} [params={}] 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	count(params = {}) {
		return this.doFiltering(params).count().exec();
	}

	/**
	 * Insert an entity
	 * 
	 * @param {Object} entity 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	insert(entity) {
		const item = new this.collection(entity);
		return item.save();
	}

	/**
	 * Insert many entities
	 * 
	 * @param {Array} entities 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	insertMany(entities) {
		return this.collection.insertMany(entities);
	}

	/**
	 * Update entities by `query` and `update`
	 * 
	 * @param {any} params 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	update(params) {
		return this.collection.update(params.query, params.update, { multi: true, "new": true }).then(res => res.map(doc => doc.toJSON()));
	}

	/**
	 * Update an entity by ID and `update
	 * 
	 * @param {any} _id 
	 * @param {any} update 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	updateById(_id, update) {
		return this.collection.findByIdAndUpdate(_id, update, { "new": true }).then(res => res.toJSON());
	}

	/**
	 * Remove entities which are matched by `query`
	 * 
	 * @param {any} params 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	remove(params) {
		return this.collection.remove(params.query);
	}

	/**
	 * Remove an entity by ID
	 * 
	 * @param {any} _id 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	removeById(_id) {
		return this.collection.findByIdAndRemove(_id);
	}

	/**
	 * Clear all entities from collection
	 * 
	 * @returns {Promise}
	 * 
	 * @memberof MongooseStoreAdapter
	 */
	clear() {
		return this.collection.remove({}).then(() => null);
	}

	/**
	 * Create a filtered query
	 * Available filters in `params`: 
	 *  - search
	 * 	- sort
	 * 	- limit
	 * 	- offset
	 * 
 	 * @param {Object} params 
	 * @returns {MongoQuery}
	 */
	doFiltering(params) {
		if (params) {
			const q = this.collection.find(params.query);
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

			return q;
		}
		return this.collection.find();
	}

}

module.exports = MongooseStoreAdapter;
