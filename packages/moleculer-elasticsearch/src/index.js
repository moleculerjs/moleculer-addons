/*
 * moleculer-elasticsearch
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const Elasticsearch = require("elasticsearch");

/**
 * Elasticsearch service for Moleculer.
 * 
 * Running Elasticsearch server for development:
 * 	https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#docker-cli-run
 * 
 * 	docker run -p 9200:9200 -e "http.host=0.0.0.0" -e "transport.host=127.0.0.1" docker.elastic.co/elasticsearch/elasticsearch:5.5.0
 * 
 * @name moleculer-elasticsearch
 * @module Service
 */
module.exports = {

	name: "elasticsearch",

	/**
	 * Default settings
	 */
	settings: {
		/** @type {Object} Elasticsearch constructor options. More options: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html */
		elasticsearch: {
			host: process.env.ELASTICSEARCH_HOST || "http://localhost:9200",
			apiVersion: "5.4"
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Perform many index/delete operations in a single API call.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-bulk
		 * 
		 * @actions
		 * 
		 * @param {String=} index - Default index for items which don’t provide one
		 * @param {String=} type - Default document type for items which don’t provide one
		 * @param {Array} body - The request body, as either an array of objects or new-line delimited JSON objects
		 * 
		 * @returns {Array<Object>} ???
		 */
		bulk: {
			params: {
				index: { type: "string", optional: true },
				type: { type: "string", optional: true },
				body: { type: "array" }
			},
			handler(ctx) {
				return this.client.create(ctx.params);
			}
		},

		/**
		 * Adds a typed JSON document in a specific index, making it searchable. If a document with the same index, type, and id already exists, an error will occur.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-create
		 * 
		 * @actions
		 * 
		 * @param {String} index - The name of the index
		 * @param {String} type - The type of the document
		 * @param {String} id - Document ID
		 * @param {Object} body - The request body, as either JSON or a JSON serializable object. 
		 * 
		 * @returns {Array<Object>} ???
		 */
		create: {
			params: {
				index: { type: "string" },
				type: { type: "string" },
				id: { type: "string" },
				body: { type: "object" }
			},
			handler(ctx) {
				return this.client.create(ctx.params);
			}
		},


		/**
		 * Update (reindex) the document with the specified unique id.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-update
		 * 
		 * @actions
		 * 
		 * @param {String} index - The name of the index
		 * @param {String} type - The type of the document
		 * @param {String} id - Document ID
		 * @param {Object} body - The request body, as either JSON or a JSON serializable object. 
		 * 
		 * @returns {Array<Object>} ???
		 */
		update: {
			params: {
				index: { type: "string" },
				type: { type: "string" },
				id: { type: "string" },
				body: { type: "object" }
			},
			handler(ctx) {
				return this.client.update(ctx.params);
			}
		},


		/**
		 * Delete the document with the specified unique id.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-delete
		 * 
		 * @actions
		 * 
		 * @param {String} index - The name of the index
		 * @param {String} type - The type of the document
		 * @param {String} id - Document ID
		 * 
		 * @returns {Array<Object>} ???
		 */
		delete: {
			params: {
				index: { type: "string" },
				type: { type: "string" },
				id: { type: "string" }
			},
			handler(ctx) {
				return this.client.delete(ctx.params);
			}
		},


		/**
		 * Return documents matching a query, aggregations/facets, highlighted snippets, suggestions, and more.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search
		 * 
		 * @actions
		 * 
		 * @param {String|Array<String>} index - A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices
		 * @param {String|Array<String>} type - A comma-separated list of document types to search; leave empty to perform the operation on all types
		 * @param {String=} q - Query in the Lucene query string syntax. 
		 * @param {Object=} body - The request body, as either JSON or a JSON serializable object. 
		 * 
		 * @returns {Array<Object>} ???
		 */
		search: {
			params: {
				index: [
					{ type: "string", optional: true },
					{ type: "array", items: "string", optional: true }
				],
				type: [
					{ type: "string", optional: true },
					{ type: "array", items: "string", optional: true }
				],
				q: { type: "string", optional: true },
				body: { type: "object", optional: true }
			},
			handler(ctx) {
				return this.client.search(ctx.params);
			}
		},

		/**
		 * Get the number of documents for the cluster, index, type, or a query.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-count
		 * 
		 * @actions
		 * 
		 * @param {String|Array<String>} index - A comma-separated list of indices to restrict the results.
		 * @param {String|Array<String>} type - A comma-separated list of types to restrict the results.
		 * @param {String=} q - Query in the Lucene query string syntax. 
		 * @param {Object=} body - The request body, as either JSON or a JSON serializable object. 
		 * 
		 * @returns {Array<Object>} ???
		 */
		count: {
			params: {
				index: [
					{ type: "string", optional: true },
					{ type: "array", items: "string", optional: true }
				],
				type: [
					{ type: "string", optional: true },
					{ type: "array", items: "string", optional: true }
				],
				q: { type: "string", optional: true },
				body: { type: "object", optional: true }
			},
			handler(ctx) {
				return this.client.count(ctx.params);
			}
		},


		/**
		 * Get a typed JSON document from the index based on its id.
		 * 
		 * More info: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-get
		 * 
		 * @actions
		 * 
		 * @param {String} index - The name of the index
		 * @param {String} type - The type of the document
		 * @param {String=} id - Document ID
		 * 
		 * @returns {Object} Found document
		 */
		get: {
			params: {
				index: { type: "string" },
				type: { type: "string" },
				id: { type: "string" }
			},
			handler(ctx) {
				return this.client.get(ctx.params);
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		return this.Promise.resolve();
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.client = new Elasticsearch.Client(this.settings.elasticsearch);

		return this.client.ping({ requestTimeout: 5000 });
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		return this.Promise.resolve();
	}
};