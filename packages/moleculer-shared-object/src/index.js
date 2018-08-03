/*
 * moleculer-shared-object
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const ObservableSlim = require("observable-slim");

function createSharedObj(data, notifier) {
	return ObservableSlim.create(data, true, notifier);
}

/**
 * Shared objects between Moleculer nodes.
 *
 * @name moleculer-shared-object
 * @module Service
 */
module.exports = function(opts) {
	let self = null;

	const sharedObjects = {};

	const res = {
		events: {},
		created() {
			self = this;

			Object.keys(sharedObjects).forEach(name => self[name] = sharedObjects[name]);
		}
	};

	const getOnChanges = name => changes => {
		self.logger.info("Changed: ", name, JSON.stringify(changes));
		self.broker.broadcast(`sharedObject.${name}`, changes);
	};

	if (opts) {
		if (!Array.isArray(opts))
			opts = [opts];

		opts.forEach(opt => {
			const name = _.isString(opt) ? opt : opt.name;
			sharedObjects[opt] = createSharedObj({}, getOnChanges(opt));
			res.events[`sharedObject.${name}`] = function(changes) {
				// TODO: apply changes
				self.logger.info("Received changes:", changes);
			};
		});
	}

	return res;
};
