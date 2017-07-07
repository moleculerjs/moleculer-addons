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

	// Store adapter (NeDB adapter is the default)
	adapter: null,

	/**
	 * Default settings
	 */
	settings: {
		// Name of "_id" field
		idField: "_id",
		
		// Fields filter for result entities
		fields: null,

		// Auto populates schema
		populates: null,

		// Validator schema or a function to validate the incoming entity in "users.create" action
		entityValidator: null,

		// Default page size
		pageSize: 10,

		// Maximum page size
		maxPageSize: 100,

		// Maximum value of limit in `find` action
		maxLimit: -1
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Find all entities by filters
		 * 
		 * @cache true
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
				let params = Object.assign({}, ctx.params);
				
				// Convert from string to number
				if (typeof(params.limit) === "string")
					params.limit = Number(params.limit);				
				if (typeof(params.offset) === "string")
					params.offset = Number(params.offset);

				// Limit the `limit`
				if (this.settings.maxLimit > 0 && params.limit > this.settings.maxLimit)
					params.limit = this.settings.maxLimit;

				return this.find(ctx, params);
			}
		},

		/**
		 * Get count of entities by filters
		 * 
		 * @cache true
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

		list: {
			cache: {
				keys: ["page", "pageSize", "sort", "search", "searchFields"]
			},
			params: {
				page: { type: "number", integer: true, min: 1, optional: true, convert: true },
				pageSize: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true }
			},
			handler(ctx) {
				let params = Object.assign({}, ctx.params);
				// Convert from string to number
				if (typeof(params.page) === "string")
					params.page = Number(params.page);				
				if (typeof(params.pageSize) === "string")
					params.pageSize = Number(params.pageSize);

				// Default `pageSize`
				if (!params.pageSize)
					params.pageSize = this.settings.pageSize;

				// Default `page`
				if (!params.page)
					params.page = 1;

				// Limit the `pageSize`
				if (this.settings.maxPageSize > 0 && params.pageSize > this.settings.maxPageSize)
					params.pageSize = this.settings.maxPageSize;

				// Calculate the limit & offset from page & pageSize
				params.limit = params.pageSize;
				params.offset = (params.page - 1) * params.pageSize;

				return this.Promise.all([
					// Get rows
					this.find(ctx, params),

					// Get count of all rows
					this.count(ctx, params)
				]).then(res => {
					return {
						// Rows
						rows: res[0],
						// Total rows
						total: res[1],
						// Page
						page: params.page,
						// Page size
						pageSize: params.pageSize,
						// Total pages
						totalPages: Math.floor((res[1] + params.pageSize - 1) / params.pageSize)
					};
				});
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
		 * 
		 * @cache true
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
		 * Get entity by ID or IDs. For internal use only!
		 * 
		 * @cache true
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
				return this.updateById(ctx, ctx.params);
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
				return this.removeById(ctx, ctx.params);
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
						return this.schema.afterConnected.call(this);
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
				return this.adapter.disconnect();
		},

		/**
		 * Find all entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		find(ctx, params) {
			return this.adapter.find(params)
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
			if (params && params.limit)
				params.limit = null;
			if (params && params.offset)
				params.offset = null;

			return this.adapter.count(params);
		},

		/**
		 * Create a new entity
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		create(ctx, params) {
			return this.validateEntity(params.entity)
				.then(entity => this.adapter.insert(entity))
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Create many new entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns 
		 */
		createMany(ctx, params) {
			return this.validateEntity(params.entities)
				.then(entities => this.adapter.insertMany(entities))
				.then(docs => this.transformDocuments(ctx, docs))
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
		 * @returns {Promise}
		 */
		updateById(ctx, params) {
			return this.adapter.updateById(params.id, params.update)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Update multiple entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns {Promise}
		 */
		updateMany(ctx, params) {
			return this.adapter.updateMany(params.query, params.update)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Remove an entity by ID
		 * 
		 * @param {any} ctx 
		 * @returns {Promise}
		 */
		removeById(ctx, params) {
			return this.adapter.removeById(params.id)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Remove multiple entities
		 * 
		 * @param {any} ctx 
		 * @returns {Promise}
		 */
		removeMany(ctx, params) {
			return this.adapter.removeMany(params.query)
				.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.clearCache().then(() => json));
		},

		/**
		 * Delete all entities
		 * 
		 * @returns {Promise}
		 */
		clear() {
			return this.adapter.clear()
				.then(count => this.clearCache().then(() => count));
		},

		/**
		 * Clear cache entities
		 * 
		 * @returns {Promise}
		 */
		clearCache() {
			this.broker.emit("cache.clean", this.name + ".*");
			return this.Promise.resolve();
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
					if (ctx && ctx.params.populate !== false)
						return this.populateDocs(ctx, json);
					return json;
				})
				.then(docs => this.filterFields(docs, ctx ? ctx.params.fields : null));
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
		},

		/**
		 * Validate an entity by validator
		 * 
		 * @param {any} entity 
		 * @returns {Promise}
		 */
		validateEntity(entity) {
			if (!_.isFunction(this.settings.entityValidator))
				return this.Promise.resolve(entity);

			let entities = Array.isArray(entity) ? entity : [entity];
			return this.Promise.all(entities.map(entity => this.settings.entityValidator(entity))).then(() => entity);
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

		// Transform validation schema to checker function
		if (this.broker.validator && _.isObject(this.settings.entityValidator)) {
			const check = this.broker.validator.compile(this.settings.entityValidator);
			this.settings.entityValidator = entity => {
				const res = check(entity);
				if (res === true)
					return this.Promise.resolve();
				else
					return this.Promise.reject(res);
			};
		}
		
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		if (this.adapter) {
			return new this.Promise(resolve => {
				let connecting = () => {
					this.connect().then(resolve).catch(err => {
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
		return this.Promise.reject(new Error("Please set the store adapter in schema!"));
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		if (this.adapter)
			return this.disconnect();

		/* istanbul ignore next */
		return this.Promise.reject(new Error("Please set the store adapter in schema!"));
	},

	// Export Memory Adapter class
	MemoryAdapter
};
