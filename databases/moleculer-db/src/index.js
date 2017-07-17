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

		// Population schema
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
				keys: ["populate", "fields", "limit", "offset", "sort", "search", "searchFields", "query"]
			},
			params: {
				populate: { type: "array", optional: true, items: "string" },
				fields: { type: "array", optional: true, items: "string" },
				limit: { type: "number", integer: true, min: 0, optional: true, convert: true },
				offset: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true },
				query: { type: "object", optional: true }
			},
			handler(ctx) {
				let params = this.sanitizeParams(ctx, ctx.params);

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
				keys: ["search", "searchFields", "query"]
			},
			params: {
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true },
				query: { type: "object", optional: true }
			},			
			handler(ctx) {
				let params = this.sanitizeParams(ctx, ctx.params);

				return this.count(ctx, params);
			}
		},

		/**
		 * List entities by filters and pagination results
		 * 
		 * @cache true
		 */
		list: {
			cache: {
				keys: ["populate", "fields", "page", "pageSize", "sort", "search", "searchFields", "query"]
			},
			params: {
				populate: { type: "array", optional: true, items: "string" },
				fields: { type: "array", optional: true, items: "string" },
				page: { type: "number", integer: true, min: 1, optional: true, convert: true },
				pageSize: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: { type: "array", optional: true },
				query: { type: "object", optional: true }
			},
			handler(ctx) {
				let params = this.sanitizeParams(ctx, ctx.params);

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
				let params = this.sanitizeParams(ctx, ctx.params);

				return this.create(ctx, params);
			}
		},

		/**
		 * Get entity by ID
		 * 
		 * @cache true
		 */
		get: {
			cache: {
				keys: ["id", "populate", "fields", "mapping"]
			},
			params: {
				id: [
					{ type: "string" },
					{ type: "number" },
					{ type: "array" }
				],
				populate: { type: "array", optional: true, items: "string" },
				fields: { type: "array", optional: true, items: "string" },
				mapping: { type: "boolean", optional: true }
			},				
			handler(ctx) {
				let params = this.sanitizeParams(ctx, ctx.params);

				return this.getById(ctx, params);
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
				let params = this.sanitizeParams(ctx, ctx.params);

				return this.updateById(ctx, params);
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
				let params = this.sanitizeParams(ctx, ctx.params);

				return this.removeById(ctx, params);
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
		 * Sanitize context parameters at `find` action
		 * 
		 * @param {Context} ctx 
		 * @param {any} origParams 
		 * @returns {Promise}
		 */
		sanitizeParams(ctx, params) {
			let p = Object.assign({}, params);

			// Convert from string to number
			if (typeof(p.limit) === "string")
				p.limit = Number(p.limit);				
			if (typeof(p.offset) === "string")
				p.offset = Number(p.offset);
			if (typeof(p.page) === "string")
				p.page = Number(p.page);				
			if (typeof(p.pageSize) === "string")
				p.pageSize = Number(p.pageSize);

			if (typeof(p.sort) === "string")
				p.sort = p.sort.replace(/,/, " ").split(" ");

			if (typeof(p.fields) === "string")
				p.fields = p.fields.replace(/,/, " ").split(" ");

			if (typeof(p.populate) === "string")
				p.populate = p.populate.replace(/,/, " ").split(" ");

			if (ctx.action.name.endsWith(".list")) {
				// Default `pageSize`
				if (!p.pageSize)
					p.pageSize = this.settings.pageSize;

				// Default `page`
				if (!p.page)
					p.page = 1;

				// Limit the `pageSize`
				if (this.settings.maxPageSize > 0 && p.pageSize > this.settings.maxPageSize)
					p.pageSize = this.settings.maxPageSize;

				// Calculate the limit & offset from page & pageSize
				p.limit = p.pageSize;
				p.offset = (p.page - 1) * p.pageSize;
			}
			// Limit the `limit`
			if (this.settings.maxLimit > 0 && p.limit > this.settings.maxLimit)
				p.limit = this.settings.maxLimit;

			return p;
		},

		/**
		 * Find all entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns {Promise}
		 */
		find(ctx, params) {
			return this.adapter.find(params)
				.then(docs => this.transformDocuments(ctx, ctx.params, docs));
		},

		/**
		 * Get count of entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns {Promise}
		 */
		count(ctx, params) {
			// Remove pagination params
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
		 * @returns {Promise}
		 */
		create(ctx, params) {
			return this.validateEntity(params.entity)
				.then(entity => this.adapter.insert(entity))
				.then(doc => this.transformDocuments(ctx, params, doc))
				.then(json => this.entityChanged("created", json, ctx).then(() => json));
		},

		/**
		 * Create many new entities
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns {Promise}
		 */
		createMany(ctx, params) {
			return this.validateEntity(params.entities)
				.then(entities => this.adapter.insertMany(entities))
				.then(docs => this.transformDocuments(ctx, params, docs))
				.then(json => this.entityChanged("created", json, ctx).then(() => json));
		},

		/**
		 * Get entity/entities by ID(s)
		 * 
		 * @param {Context} ctx 
		 * @param {Object} params
		 * @returns {Promise}
		 */
		getById(ctx, params) {
			let origDoc;
			return this.Promise.resolve(params)

				.then(({ id }) => {
					if (_.isArray(id)) {
						id = id.map(id => this.decodeID(id));
						return this.adapter.findByIds(id);
					} else {
						id = this.decodeID(id);
						return this.adapter.findById(id);
					}
				})

				.then(doc => {
					origDoc = doc;
					return this.transformDocuments(ctx, ctx.params, doc);
				})

				.then(json => {
					if (_.isArray(json) && params.mapping === true) {
						let res = {};
						json.forEach((doc, i) => {
							const id = origDoc[i][this.settings.idField];
							res[id] = doc;
						});

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
			return this.adapter.updateById(this.decodeID(params.id), params.update)
				.then(doc => this.transformDocuments(ctx, params, doc))
				.then(json => this.entityChanged("updated", json, ctx).then(() => json));
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
				.then(doc => this.transformDocuments(ctx, params, doc))
				.then(json => this.entityChanged("updated", null, ctx).then(() => json));
		},

		/**
		 * Remove an entity by ID
		 * 
		 * @param {any} ctx 
		 * @returns {Promise}
		 */
		removeById(ctx, params) {
			return this.adapter.removeById(this.decodeID(params.id))
				//.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.entityChanged("removed", null, ctx).then(() => json));
		},

		/**
		 * Remove multiple entities
		 * 
		 * @param {any} ctx 
		 * @returns {Promise}
		 */
		removeMany(ctx, params) {
			return this.adapter.removeMany(params.query)
				//.then(doc => this.transformDocuments(ctx, doc))
				.then(json => this.entityChanged("removed", null, ctx).then(() => json));
		},

		/**
		 * Delete all entities
		 * 
		 * @param {any} ctx 
		 * @returns {Promise}
		 */
		clear(ctx) {
			return this.adapter.clear()
				.then(count => this.entityChanged("removed", null, ctx).then(() => count));
		},

		/**
		 * Clear the cache & call entity lifecycle events
		 * 
		 * @param {String} type 
		 * @param {Object|Array} json 
		 * @param {Context} ctx 
		 * @returns {Promise}
		 */
		entityChanged(type, json, ctx) {
			return this.clearCache().then(() => {
				const eventName = `entity${_.capitalize(type)}`;
				if (this.schema[eventName] != null) {
					return this.schema[eventName].call(this, json, ctx);
				}
			});
		},

		/**
		 * Clear cached entities
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
		 * @param {Array|Object} 	docs 
		 * @param {Object} 			Params
		 * @returns {Array|Object}
		 */
		transformDocuments(ctx, params, docs) {
			let isDoc = false;
			if (!Array.isArray(docs)) {
				if (_.isObject(docs)) {
					isDoc = true;
					docs = [docs];
				} else
					return this.Promise.resolve(docs);
			}

			return this.Promise.resolve(docs)

				// Convert entity to JS object
				.then(docs => docs.map(doc => this.adapter.entityToObject(doc)))

				// Encode IDs
				.then(docs => docs.map(doc => {
					doc[this.settings.idField] = this.encodeID(doc[this.settings.idField]);
					return doc;
				}))

				// Populate
				.then(json => (ctx && params.populate) ? this.populateDocs(ctx, json, params.populate) : json)

				// TODO onTransformHook

				// Filter fields
				.then(json => {
					let fields = ctx && params.fields ? params.fields : this.settings.fields;

					// Compatibility with < 0.4
					/* istanbul ignore next */
					if (_.isString(fields))
						fields = fields.split(" ");

					// Authorize the requested fields
					const authFields = this.authorizeFields(fields);

					return json.map(item => this.filterFields(item, authFields));
				})

				// Return
				.then(json => isDoc ? json[0] : json);
		},

		/**
		 * Filter fields in the entity object
		 * 
		 * @param {Object} 	doc
		 * @param {Array} 	fields	Filter properties of model.
		 * @returns	{Object}
		 * 
		 * @memberOf Service
		 */
		filterFields(doc, fields) {
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
		 * Authorize the required field list. Remove fields which is not exist in the `this.settings.fields`
		 * 
		 * @param {Array} f 
		 * @returns {Array}
		 */
		authorizeFields(fields) {
			if (this.settings.fields && this.settings.fields.length > 0) {
				let res = [];
				if (Array.isArray(fields) && fields.length > 0) {
					fields.forEach(f => {
						if (this.settings.fields.indexOf(f) !== -1) {
							res.push(f);
							return;
						}

						if (f.indexOf(".") !== -1) {
							let parts = f.split(".");
							while (parts.length > 1) {
								parts.pop();
								if (this.settings.fields.indexOf(parts.join(".")) !== -1) {
									res.push(f);
									break;
								}
							}
						}

						let nestedFields = this.settings.fields.filter(prop => prop.indexOf(f + ".") !== -1);
						if (nestedFields.length > 0) {
							res = res.concat(nestedFields);
						}
					});
					//return _.intersection(f, this.settings.fields);
				}
				return res;
			}

			return fields;
		},

		/**
		 * Populate documents
		 * 
		 * @param {Context} 		ctx
		 * @param {Array|Object} 	docs
		 * @param {Array}			populateFields
		 * @returns	{Promise}
		 */
		populateDocs(ctx, docs, populateFields) {
			if (!this.settings.populates || !Array.isArray(populateFields) || populateFields.length == 0)
				return this.Promise.resolve(docs);

			if (docs == null || !_.isObject(docs) || !Array.isArray(docs))
				return this.Promise.resolve(docs);

			let promises = [];
			_.forIn(this.settings.populates, (rule, field) => {

				if (populateFields.indexOf(field) === -1)
					return; // skip

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

				let arr = Array.isArray(docs) ? docs : [docs];
				// Collect IDs from field of docs (flatten, compact & unique list) 
				let idList = _.uniq(_.flattenDeep(_.compact(arr.map(doc => doc[field]))));
				if (idList.length > 0) {
					// Replace the received models according to IDs in the original docs
					const resultTransform = (populatedDocs) => {
						arr.forEach(doc => {
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
							mapping: true,
							populate: rule.populate
						}, rule.params || {});

						promises.push(ctx.call(rule.action, params).then(resultTransform));
					}
				}
			});

			return this.Promise.all(promises).then(() => docs);
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
		},

		/**
		 * Encode ID of entity
		 * 
		 * @param {any} id 
		 * @returns {any}
		 */
		encodeID(id) {
			return id;
		},

		/**
		 * Decode ID of entity
		 * 
		 * @param {any} id 
		 * @returns {any}
		 */
		decodeID(id) {
			return id;
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		// Compatibility with < 0.4
		if (_.isString(this.settings.fields)) {
			this.settings.fields = this.settings.fields.split(" ");
		}		

		if (!this.schema.adapter)
			this.adapter = new MemoryAdapter();
		else
			this.adapter = this.schema.adapter;

		this.adapter.init(this.broker, this);

		// Transform entity validation schema to checker function
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
	},

	// Export Memory Adapter class
	MemoryAdapter
};
