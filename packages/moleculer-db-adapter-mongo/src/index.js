/*
 * moleculer-db-adapter-mongo
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 			= require("lodash");
const Promise		= require("bluebird");
const mongodb 		= require("mongodb");
const MongoClient 	= mongodb.MongoClient;
const ObjectID 		= mongodb.ObjectID;

//Promise.promisifyAll(MongoClient);
//Promise.promisifyAll(mongodb.Collection.prototype);
//Promise.promisifyAll(mongodb.Cursor.prototype);

function hexToObjectID(id) {
	return new ObjectID.createFromHexString(id);
}

class MongoDbAdapter {

	/**
	 * Creates an instance of MongoDbAdapter.
	 * @param {any} opts 
	 * 
	 * @memberof MongoDbAdapter
	 */
	constructor(opts) {
		this.opts = opts;
	}

	/**
	 * Initialize adapter
	 * 
	 * @param {ServiceBroker} broker 
	 * @param {Service} service 
	 * 
	 * @memberof MongoDbAdapter
	 */
	init(broker, service) {
		this.broker = broker;
		this.service = service;

		if (!this.service.schema.collection) {
			/* istanbul ignore next */
			throw new Error("Missing `collection` definition in schema of service!");
		}
	}

	/**
	 * Connect to database
	 * 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	connect() {
		let uri, opts;
		if (_.isObject(this.opts) && this.opts.uri != null) {
			uri = this.opts.uri;
			opts = Object.assign({ promiseLibrary: Promise }, this.opts.opts);
		} else {
			uri = this.opts;
		}

		return MongoClient.connect(uri, opts).then(db => {
			this.db = db;
			this.collection = db.collection(this.service.schema.collection);
 
			/* ???
			this.db.on("disconnected", function mongoDisconnected() {
				this.service.logger.warn("Disconnected from MongoDB.");
			}.bind(this));
			*/
			
		});
	}

	/**
	 * Disconnect from database
	 * 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	disconnect() {
		if (this.db) {
			this.db.close();
		}
		return Promise.resolve();
	}

	/**
	 * Find all entities by filters.
	 * 
	 * Available filter props:
	 * 	- limit
	 *  - offset
	 *  - sort
	 *  - search
	 *  - searchFields
	 *  - query
	 * 
	 * @param {any} filters 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	find(filters) {
		return this.doFiltering(filters).toArray();
	}

	/**
	 * Find an entities by ID
	 * 
	 * @param {any} _id 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	findById(_id) {
		return this.collection.findOne({ _id: hexToObjectID(_id) });
	}

	/**
	 * Find any entities by IDs
	 * 
	 * @param {Array} idList 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	findByIds(idList) {
		return this.collection.find({
			_id: {
				$in: idList
			}
		}).toArray();
	}

	/**
	 * Get count of filtered entites
	 * 
	 * Available filter props:
	 *  - search
	 *  - searchFields
	 *  - query
	 * 
	 * @param {Object} [filters={}] 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	count(filters = {}) {
		//return this.doFiltering(filters).count().toArray().then(docs => docs.length);
	}

	/**
	 * Insert an entity
	 * 
	 * @param {Object} entity 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	insert(entity) {
		return this.collection.insertOne(entity).then(res => {
			if (res.insertedCount > 0)
				return res.ops[0];
		});
	}

	/**
	 * Insert many entities
	 * 
	 * @param {Array} entities 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	insertMany(entities) {
		return this.collection.insertMany(entities).then(res => {
			return res.ops;
		});
	}

	/**
	 * Update many entities by `query` and `update`
	 * 
	 * @param {Object} query 
	 * @param {Object} update 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	updateMany(query, update) {
		return this.collection.updateMany(query, update);
	}

	/**
	 * Update an entity by ID and `update`
	 * 
	 * @param {any} _id 
	 * @param {Object} update 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	updateById(_id, update) {
		return this.collection.findOneAndUpdate({ _id }, update, { returnOriginal: false });
	}

	/**
	 * Remove entities which are matched by `query`
	 * 
	 * @param {Object} query 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	removeMany(query) {
		return this.collection.deleteMany(query);
	}

	/**
	 * Remove an entity by ID
	 * 
	 * @param {any} _id 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	removeById(_id) {
		return this.collection.findOneAndDelete({ _id }).then(doc => doc ? 1 : 0);
	}

	/**
	 * Clear all entities from collection
	 * 
	 * @returns {Promise}
	 * 
	 * @memberof MongoDbAdapter
	 */
	clear() {
		return this.collection.deleteMany({}).then(() => null);
	}

	/**
	 * Convert DB entity to JSON object
	 * 
	 * @param {any} entity 
	 * @returns {Object}
	 * @memberof MongoDbAdapter
	 */
	entityToObject(entity) {
		let json = Object.assign({}, entity);
		if (entity._id)
			json._id = entity._id.toHexString();
		return json;
	}

	/**
	 * Create a filtered query
	 * Available filters in `params`: 
	 *  - search
	 * 	- sort
	 * 	- limit
	 * 	- offset
	 *  - query
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

module.exports = MongoDbAdapter;
