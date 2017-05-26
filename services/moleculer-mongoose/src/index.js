/*
 * moleculer-mongoose
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const mongoose = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = {
	// Must overwrite it
	name: "",

	/**
	 * Default settings
	 */
	settings: {
		// Connection string
		db: null,

		// Field find for search
		searchFields: null,

		// Fields filter
		fields: null,

		// Auto populates
		populates: null
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * 
		 */
		find: {
			cache: {
				keys: ["limit", "offset", "sort", "search"]
			},
			handler(ctx) {
				return this.find(ctx);
			}
		},

		/**
		 * 
		 */
		count: {
			cache: {
				keys: ["search"]
			},
			handler(ctx) {
				return this.count(ctx);
			}
		},

		/**
		 * 
		 */
		create: {
			handler(ctx) {
				return this.create(ctx);
			}
		},

		/**
		 * 
		 */
		get: {
			cache: {
				keys: ["id"]
			},
			handler(ctx) {
				return this.get(ctx);
			}
		},

		/**
		 * 
		 */
		model: {
			cache: {
				keys: ["id"]
			},
			handler(ctx) {
				return this.model(ctx);
			}
		},

		/**
		 * 
		 */
		update: {
			handler(ctx) {
				return this.update(ctx);
			}
		},

		/**
		 * 
		 */
		remove: {
			handler(ctx) {
				return this.remove(ctx);
			}
		},

		/**
		 * 
		 */
		clear: {
			handler(ctx) {
				return this.clear(ctx);
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {

		/**
		 * 
		 * 
		 */
		connect() {
			let uri, opts;
			if (_.isObject(this.settings.db) && this.settings.db.uri != null) {
				uri = this.settings.db.uri;
				opts = this.settings.db.opts;
			} else {
				uri = this.settings.db;
			}

			this.logger.debug(`Connecting to MongoDB (${uri})...`);
			const conn = mongoose.connect(uri, opts);
			return conn.then(() => {
				this.db = conn.connection;
				this.logger.info("Connected to MongoDB.");

				// Call an 'afterConnected' handler in schema
				if (_.isFunction(this.schema.afterConnected))
					this.schema.afterConnected.call(this);

				this.db.on("disconnected", function mongoDisconnected() {
					this.logger.warn("Disconnected from MongoDB.");
				}.bind(this));

			}).catch(err => {
				this.logger.warn("Could not connect to MongoDB! ", err.message);
				setTimeout(() => {
					this.connect();
				}, 1000);

			});
		},

		/**
		 * 
		 * 
		 */
		disconnect() {
			if (this.db) {
				this.db.close();
			}
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		find(ctx) {
			const filter = {};

			const query = this.collection.find(filter);
			return this.applyFilters(query, ctx.params).lean().exec()
				.then(docs => this.transformDocuments(ctx, docs));
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		count(ctx) {
			const filter = {};
			// TODO: search
			return this.collection.where(filter).count();
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		create(ctx) {
			return this.Promise.resolve(ctx.params)
				.then(({
					entity
				}) => {
					const item = new this.collection(entity);
					return item.save();
				})
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		get(ctx) {
			return this.Promise.resolve(ctx.params)
				.then(({
					id
				}) => this.collection.findById(id).lean().exec())
				.then(docs => this.transformDocuments(ctx, docs));
		},

		getID(doc) {
			return (doc._id instanceof ObjectId) ? doc._id.toString() : doc._id;
		},

		/**
		 * 
		 * 
		 * @param {any} params 
		 * @returns 
		 */
		resolveModels(params) {
			return this.Promise.resolve(params)
				.then(({
					id
				}) => {
					let query;
					if (_.isArray(id)) {
						query = this.collection.find({
							_id: {
								$in: id
							}
						});
					} else {
						query = this.collection.findById(id);
					}

					return query.lean().exec();
				});
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		model(ctx) {
			let origDoc;
			return this.resolveModels(ctx.params)
				.then(doc => {
					origDoc = doc;
					if (ctx.params.fields !== false)
						return this.toFilteredJSON(doc, ctx.params.fields);
					return doc;
				})
				.then(json => {
					if (ctx.params.populate === true)
						return this.populateDocs(ctx, json);
					return json;
				})
				.then(json => {
					if (_.isArray(json) && ctx.params.resultAsObject === true) {
						let res = {};
						json.forEach((doc, i) => res[origDoc[i]._id] = doc);

						return res;
					}
					return json;
				});
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		update(ctx) {
			return this.Promise.resolve(ctx.params)
				.then(({
					id,
					update
				}) => this.collection.findByIdAndUpdate(id, update, {
					"new": true
				}))
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		remove(ctx) {
			return this.Promise.resolve(ctx.params)
				.then(({
					id
				}) => this.collection.findByIdAndRemove(id))
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Delete all records
		 * 
		 * @returns 
		 */
		clear() {
			return this.collection.remove({})
				.then(() => this.clearCache());
		},

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
				if (_.isNumber(params.offset))
					q.skip(params.offset);
			}
			return q;
		},

		/**
		 * Clear cache entities
		 * 
		 */
		clearCache() {
			this.broker.emit("cache.clean", this.name + ".*");
			return Promise.resolve();
		},

		/**
		 * Transform the fetched documents
		 * 
		 * @param {Array|Object} docs 
		 * @returns {Array|Object}
		 */
		transformDocuments(ctx, docs) {
			//console.log(docs);
			return this.Promise.resolve(docs)
				.then(json => {
					if (ctx.params.populate !== false)
						return this.populateDocs(ctx, json);
					return json;
				})
				.then(docs => this.toFilteredJSON(docs, ctx.params.fields));
		},

		/**
		 * Convert the `docs` MongoDB model to JSON object.
		 * With `fields` can be filter the fields
		 * 
		 * @param {MongoDocument} 	docs	MongoDB document(s)
		 * @param {String|Array} 	fields	Filter properties of model. It is a space-separated `String` or an `Array`
		 * @returns	{Object|Array}
		 * 
		 * @memberOf Service
		 */
		toFilteredJSON(docs, fields = this.settings.fields) {
			if (_.isString(fields)) {
				fields = fields.split(" ");
			}

			if (_.isArray(docs)) {
				return docs.map(doc => this.convertToJSON(doc, fields));
			} else {
				return this.convertToJSON(docs, fields);
			}
		},

		/**
		 * 
		 * 
		 * @param {Object} doc 
		 * @param {Array} fields 
		 * @returns 
		 */
		convertToJSON(doc, fields) {
			let json = (doc.constructor && doc.constructor.name === "model") ? doc.toJSON() : doc;

			if (json._id instanceof ObjectId)
				json._id = json._id.toString();

			// Apply field filter (support nested paths)
			if (Array.isArray(fields)) {
				let res = {};
				fields.forEach(n => {
					const v = _.get(json, n);
					if (v !== undefined)
						_.set(res, n, v);
				});
				return res;
			}

			return json;
		},

		/**
		 * Populate documents
		 * 
		 * @param {Context} ctx				Context
		 * @param {Array} 	docs			Models
		 * @param {Object?}	populateRules	schema for population
		 * @returns	{Promise}
		 */
		populateDocs(ctx, docs, populateRules = this.settings.populates) {
			if (docs != null && populateRules) {
				let promises = [];
				_.forIn(populateRules, (rules, field) => {
					// if the rule is a function, call it
					if (_.isFunction(rules)) {
						promises.push(this.Promise.method(rules.call(this, field, ctx, docs)));
						return;
					}

					// If string, convert to object
					if (_.isString(rules)) {
						rules = {
							action: rules
						};
					}

					let items = Array.isArray(docs) ? docs : [docs];

					// Collect IDs from field of docs (flatten, compact & unique list) 
					let idList = _.uniq(_.flattenDeep(_.compact(items.map(doc => {
						let id = doc[field];
						if (id instanceof ObjectId)
							id = id.toString();
						return id;
					}))));

					if (idList.length > 0) {
						// Call the target action & collect the promises
						const params = Object.assign({
							id: idList,
							resultAsObject: true,
							populate: false
						}, rules.params || []);

						promises.push(ctx.call(rules.action, params).then(populatedDocs => {
							// Replace the received models according to IDs in the original docs
							items.forEach(doc => {
								let id = doc[field];
								if (_.isArray(id)) {
									let models = _.compact(id.map(_id => populatedDocs[_id]));
									doc[field] = models;
								} else {
									doc[field] = populatedDocs[id];
								}
							});
						}));
					}
				});

				if (promises.length > 0) {
					return this.Promise.all(promises).then(() => docs);
				}
			}

			// Fallback, if no populate defined
			return this.Promise.resolve(docs);
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		if (!this.schema.collection)
			throw new Error("Missing `collection` definition!");

		mongoose.Promise = this.Promise;
		this.collection = this.schema.collection;

		this.db = null;
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.connect();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		this.disconnect();
	}
};
