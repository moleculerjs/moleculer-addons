/*
 * moleculer-mongoose
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ 		= require("lodash");
const mongoose 	= require("mongoose");

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

		// Property filter
		propertyFilter: null,

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
				keys: [ "limit", "offset", "sort", "search" ]
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
				keys: [ "search" ]
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
				keys: [ "id" ]
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
				keys: [ "id" ]
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
					this.tryConnect();
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
				.then(({ entity }) => {
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
				.then(({ id }) => this.collection.findById(id).lean().exec())
				.then(docs => this.transformDocuments(ctx, docs));
		},

		/**
		 * 
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		model(ctx) {
			return this.Promise.resolve(ctx.params)
				.then(({ id }) => {
					return this.collection.findById(id).lean().exec();
				})
				.then(doc => {
					if (ctx.params.propertyFilter != null)
						return this.toJSON(doc, ctx.params.propertyFilter);
					return doc;
				})
				.then(json => {
					if (ctx.params.populate === true)
						return this.populateDocs(ctx, json);
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
				.then(({id, update }) => this.collection.findByIdAndUpdate(id, update, { "new": true }))
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
				.then(({ id }) => this.collection.findByIdAndRemove(id))
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * 
		 * 
		 * @returns 
		 */
		clear() {
			return this.collection.remove({})
				.then(() => this.clearCache());
		},

		/**
		 * 
		 * 
		 * @param {any} q 
		 * @param {any} params 
		 * @returns 
		 */
		applyFilters(q, params) {
			if (params) {
				if (_.isNumber(params.limit))
					q.limit(params.limit);

				if (_.isNumber(params.offset))
					q.skip(params.offset);

				if (_.isString(params.sort))
					q.sort(params.sort.replace(/,/, " "));

				// TODO `search` with `searchField`
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
		 * 
		 * 
		 * @param {any} docs 
		 * @returns 
		 */
		transformDocuments(ctx, docs) {
			return this.Promise.resolve(docs)
				.then(docs => this.toJSON(docs))
				.then(json => this.populateDocs(ctx, json));
		},

		/**
		 * Convert the `docs` MongoDB model to JSON object.
		 * With `propFilter` can be filter the properties
		 * 
		 * @param {MongoDocument} 	docs		MongoDB document(s)
		 * @param {String|Array} 	propFilter	Filter properties of model. It is a space-separated `String` or an `Array`
		 * @returns	{Object|Array}
		 * 
		 * @memberOf Service
		 */
		toJSON(docs, propFilter = this.settings.propertyFilter) {
			if (_.isString(propFilter)) {
				propFilter = propFilter.split(" ");
			}

			if (_.isArray(docs)) {
				return docs.map(doc => this.convertToJSON(doc, propFilter));
			} else {			
				return this.convertToJSON(docs, propFilter);
			}
		},

		convertToJSON(doc, props) {
			let json = (doc.constructor && doc.constructor.name === "model") ? doc.toJSON() : doc;

			if (props != null)
				return _.pick(json, props);

			return json;
		},

		/**
		 * Populate docs
		 * 
		 * @param {Context} ctx				Context
		 * @param {Array} 	docs			Models
		 * @param {Object?}	populateSchema	schema for population
		 * @returns	{Promise}
		 */
		populateDocs(ctx, docs, populateSchema) {
			populateSchema = populateSchema || this.settings.populates;
			if (docs != null && populateSchema) {
				let promises = [];
				_.forIn(populateSchema, (actionName, field) => {
					if (_.isString(actionName)) {
						let items = Array.isArray(docs) ? docs : [docs];

						// Collect IDs from field of docs (flatten, compact & unique list) 
						let idList = _.uniq(_.flattenDeep(_.compact(items.map(doc => doc[field]))));
						if (idList.length > 0) {

							// Call the target action & collect the promises
							promises.push(ctx.call(actionName, {
								id: idList,
								resultAsObject: true,
								propFilter: true
							}).then(populatedDocs => {
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
					} else if(_.isFunction(actionName)) {
						promises.push(this.Promise.method(actionName.call(this, field, ctx, docs)));
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