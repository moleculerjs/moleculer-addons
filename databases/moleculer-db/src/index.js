/*
 * moleculer-db
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const MemoryAdapter = require("./memory-adapter");

module.exports = {
	// Must overwrite it
	name: "",

	// Store adapter (default is a NeDB memory adapter)
	adapter: null,

	/**
	 * Default settings
	 */
	settings: {
		// Name of "_id" field
		idField: "_id",
		
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
				keys: ["limit", "offset", "sort", "search", "searchFields"]
			},
			params: {
				limit: { type: "number", integer: true, min: 0, optional: true, convert: true },
				offset: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true }
			},
			handler(ctx) {
				if (typeof(ctx.params.limit) === "string")
					ctx.params.limit = Number(ctx.params.limit);
				if (typeof(ctx.params.offset) === "string")
					ctx.params.offset = Number(ctx.params.offset);

				return this.find(ctx, ctx.params);
			}
		},

		/**
		 * Get count of entities by filters
		 */
		count: {
			cache: {
				keys: ["search", "searchFields"]
			},
			params: {
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true }
			},			
			handler(ctx) {
				return this.count(ctx, ctx.params);
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
				return this.create(ctx, ctx.params);
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
				return this.get(ctx, ctx.params);
			}
		},

		/**
		 * Get entity by ID or IDs. For internal use!
		 */
		model: {
			cache: {
				keys: ["id", "populate", "fields", "resultAsObject"]
			},
			params: {
				id: { type: "any" },
				populate: { type: "boolean", optional: true },
				fields: { type: "any", optional: true },
				resultAsObject: { type: "boolean", optional: true }
			},			
			handler(ctx) {
				return this.model(ctx, ctx.params);
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
				return this.update(ctx, ctx.params);
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
				return this.remove(ctx, ctx.params);
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
				if (_.isFunction(this.schema.afterConnected)) {
					try {
						this.schema.afterConnected.call(this);
					} catch(err) {
						/* istanbul ignore next */
						this.logger.error("afterConnected error!", err);
					}
				}
			});
		},

		/**
		 * Disconnect from database with adapter
		 */
		disconnect() {
			if (_.isFunction(this.adapter.disconnect))
				this.adapter.disconnect();
		},

		/**
		 * Find all entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		find(ctx, params) {
			return this.adapter.findAll(params)
				.then(docs => this.transformDocuments(ctx, docs));
		},

		/**
		 * Get count of entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		count(ctx, params) {
			return this.adapter.count(params);
		},

		/**
		 * Create a new entity
		 * 
		 * @param {Context} ctx 
		 * @param {Object} entity
		 * @returns 
		 */
		create(ctx, params) {
			return this.adapter.insert(params.entity)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Get an entity by ID
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		get(ctx, params) {
			const populate = params.populate != null ? params.populate : true;
			return this.model(ctx, { id: params.id, populate });
		},

		/**
		 * Get entities by IDs. For internal use!
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		model(ctx, params) {
			let origDoc;
			return this.Promise.resolve(params)
				.then(({ id }) => {
					if (_.isArray(id)) {
						return this.adapter.findByIds(id);
					} else {
						return this.adapter.findById(id);
					}
				})
				.then(doc => {
					origDoc = doc;
					if (params.populate === true)
						return this.populateDocs(ctx, doc);
					return doc;
				})
				.then(doc => {
					if (params.fields !== false)
						return this.filterFields(doc, params.fields);
					return doc;
				})
				.then(json => {
					if (_.isArray(json) && params.resultAsObject === true) {
						let res = {};
						json.forEach((doc, i) => res[origDoc[i][this.settings.idField]] = doc);

						return res;
					}
					return json;
				});
		},

		/**
		 * Update an entity by ID
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		update(ctx, params) {
			return this.adapter.updateById(params.id, params.update)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Remove an entity by ID
		 * 
		 * @param {any} ctx 
		 * @returns 
		 */
		remove(ctx, params) {
			return this.adapter.removeById(params.id)
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
				.then(count => this.clearCache().then(() => count));
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
			return this.Promise.resolve(docs)
				.then(json => {
					if (ctx.params.populate !== false)
						return this.populateDocs(ctx, json);
					return json;
				})
				.then(docs => this.filterFields(docs, ctx.params.fields));
		},

		/**
		 * Filter fields in the entity object
		 * 
		 * @param {MongoDocument} 	docs	MongoDB document(s)
		 * @param {String|Array} 	fields	Filter properties of model. It is a space-separated `String` or an `Array`
		 * @returns	{Object|Array}
		 * 
		 * @memberOf Service
		 */
		filterFields(docs, fields = this.settings.fields) {
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
			// Apply field filter (support nested paths)
			if (Array.isArray(fields)) {
				let res = {};
				fields.forEach(n => {
					const v = _.get(doc, n);
					if (v !== undefined)
						_.set(res, n, v);
				});
				return res;
			}

			return doc;
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
			if (docs != null && populateRules && (_.isObject(docs) || Array.isArray(docs))) {
				let promises = [];
				_.forIn(populateRules, (rule, field) => {

					// if the rule is a function, save as a custom handler
					if (_.isFunction(rule)) {
						rule = {
							handler: this.Promise.method(rule)
						};
					}

					// If string, convert to object
					if (_.isString(rule)) {
						rule = {
							action: rule
						};
					}
					rule.field = field;

					let items = Array.isArray(docs) ? docs : [docs];

					// Collect IDs from field of docs (flatten, compact & unique list) 
					let idList = _.uniq(_.flattenDeep(_.compact(items.map(doc => doc[field]))));

					if (idList.length > 0) {

						// Replace the received models according to IDs in the original docs
						const resultTransform = (populatedDocs) => {
							items.forEach(doc => {
								let id = doc[field];
								if (_.isArray(id)) {
									let models = _.compact(id.map(id => populatedDocs[id]));
									doc[field] = models;
								} else {
									doc[field] = populatedDocs[id];
								}
							});
						};

						if (rule.handler) {
							promises.push(rule.handler.call(this, idList, rule, ctx).then(resultTransform));
						} else {
							// Call the target action & collect the promises
							const params = Object.assign({
								id: idList,
								resultAsObject: true,
								populate: !!rule.populate
							}, rule.params || []);

							promises.push(ctx.call(rule.action, params).then(resultTransform));
						}
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
		if (!this.schema.adapter)
			this.adapter = new MemoryAdapter();
		else
			this.adapter = this.schema.adapter;

		this.adapter.init(this.broker, this);
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		if (this.adapter) {
			return new this.Promise(resolve => {
				let connecting = () => {
					this.connect().then(() => {
						resolve();
					}).catch(err => {
						setTimeout(() => {
							this.logger.error("Connection error!", err);
							this.logger.warn("Reconnecting...");
							connecting();
						}, 1000);
					});
				};

				connecting();
			});
		}

		/* istanbul ignore next */
		return Promise.reject(new Error("Please set the store adapter in schema!"));
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		if (this.adapter)
			return this.disconnect();

		/* istanbul ignore next */
		return Promise.reject(new Error("Please set the store adapter in schema!"));
	},

	// Export Memory Adapter class
	MemoryAdapter
};
