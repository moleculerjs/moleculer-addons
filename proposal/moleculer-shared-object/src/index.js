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
	let servicePath;

	const sharedObjects = {};

	const res = {
		events: {},
		created() {
			self = this;

			servicePath = `${this.broker.nodeID}:${this.name}.${this.version}`;

			Object.keys(sharedObjects).forEach(name => self[name] = sharedObjects[name]);
		}
	};

	const getOnChanges = name => changes => {
		//self.logger.info("Changed: ", name, changes);
		self.broker.broadcast(`sharedObject.${name}`, { sender: servicePath, changes });
	};

	if (opts) {
		if (!Array.isArray(opts))
			opts = [opts];

		opts.forEach(opt => {
			const name = _.isString(opt) ? opt : opt.name;
			const obj = createSharedObj({}, getOnChanges(opt));
			res.events[`sharedObject.${name}`] = function({ sender, changes }) {
				if (sender == servicePath) return;
				// TODO: apply changes
				self.logger.info("Received changes:", changes);

				changes.forEach(change => {
					_.set(obj.__getTarget, change.currentPath, _.cloneDeep(change.newValue));
				});

				self.logger.info("------------------", "New object", obj);
			};
			sharedObjects[opt] = obj;
		});
	}

	return res;
};
