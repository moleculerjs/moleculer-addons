/*
 * moleculer-store
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");

module.exports = {
	// Must overwrite it
	name: "",

	// Store adapter
	adapter: null,

	/**
	 * Default settings
	 */
	settings: {
		// Connection settings
		db: null,

		// Fields filter
		fields: null,

		// Auto populates schema
		populates: null
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Find all entities by filters
		 */
		find: {
			cache: {
				keys: ["limit", "offset", "sort", "search"]
			},
			params: {
				limit: { type: "number", integer: true, min: 0, optional: true },
				offset: { type: "number", integer: true, min: 0, optional: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true }
			},
			handler(ctx) {
				return this.find(ctx);
			}
		},

		/**
		 * Get count of entities by filters
		 */
		count: {
			cache: {
				keys: ["search"]
			},
			params: {
				search: { type: "string", optional: true }
			},			
			handler(ctx) {
				return this.count(ctx.params);
			}
		},

		/**
		 * Create a new entity
		 */
		create: {
			params: {
				entity: { type: "any" }
			},			
			handler(ctx) {
				return this.create(ctx);
			}
		},

		/**
		 * Get entity by ID
		 */
		get: {
			cache: {
				keys: ["id"]
			},
			params: {
				id: { type: "any" }
			},			
			handler(ctx) {
				return this.get(ctx);
			}
		},

		/**
		 * Get entity by ID or IDs. For internal use!
		 */
		model: {
			cache: {
				keys: ["id"]
			},
			params: {
				id: { type: "any" }
			},			
			handler(ctx) {
				return this.model(ctx);
			}
		},

		/**
		 * Update an entity by ID
		 */
		update: {
			params: {
				id: { type: "any" },
				update: { type: "any" }
			},			
			handler(ctx) {
				return this.update(ctx);
			}
		},

		/**
		 * Remove an entity by ID
		 */
		remove: {
			params: {
				id: { type: "any" }
			},			
			handler(ctx) {
				return this.remove(ctx);
			}
		},

		/**
		 * Clear all entities
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
		 * Connect to database with adapter
		 */
		connect() {
			return this.adapter.connect().then(() => {
				// Call an 'afterConnected' handler in schema
				if (_.isFunction(this.schema.afterConnected))
					this.schema.afterConnected.call(this);

			}).catch(() => {
				setTimeout(() => {
					this.logger.warn("Reconnecting...");
					this.connect();
				}, 1000);
			});
		},

		/**
		 * Disconnect from database with adapter
		 */
		disconnect() {
			this.adapter.disconnect();
		},

		/**
		 * Find all entities
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		find(ctx) {
			return this.adapter.findAll(ctx.params)
				.then(docs => this.transformDocuments(ctx, docs));
		},

		/**
		 * Get count of entities
		 * 
		 * @param {Context?} ctx 
		 * @returns 
		 */
		count(params = {}) {
			return this.adapter.count(params);
		},

		/**
		 * Create a new entity
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		create(ctx) {
			return this.adapter.insert(ctx.params.entity)
				.then(entity => this.transformDocuments(ctx, entity))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Get an entity by ID
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		get(ctx) {
			return this.adapter.findById(ctx.params.id)
				.then(entity => this.transformDocuments(ctx, entity));
		},

		/**
		 * Get entities by IDs. For internal use!
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		model(ctx) {
			let origDoc;
			return this.Promise.resolve(ctx.params)
				.then(({ id }) => {
					if (_.isArray(id)) {
						return this.adapter.findByIds(id);
					} else {
						return this.adapter.findById(id);
					}
				})
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
		 * Update an entity by ID
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		update(ctx) {
			return this.adapter.updateById(ctx.params.id, ctx.params.update)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Remove an entity by ID
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		remove(ctx) {
			return this.adapter.removeById(ctx.params.id)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Delete all entities
		 * 
		 * @returns 
		 */
		clear() {
			return this.adapter.clear()
				.then(() => this.clearCache());
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
					let idList = _.uniq(_.flattenDeep(_.compact(items.map(doc => doc[field]))));

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
		if (!this.adapter)
			throw new Error("Please set the store adapter in schema!");

		this.adapter = this.schema.adapter;
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		if (this.adapter)
			this.connect();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		if (this.adapter)
			this.disconnect();
	}
};
