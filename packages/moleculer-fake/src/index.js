/*
 * moleculer-fake
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

"use strict";

const Fakerator = require("fakerator");
const _ = require("lodash");

module.exports = {

	name: "fake",

	/**
	 * Default settings
	 */
	settings: {
		locale: null, // default is "en-US"
		seed: null
	},

	/**
	 * Actions
	 */
	actions: {
		boolean(ctx) { return this.generate(ctx, "random.boolean", [ctx.params.likelihoodPercent]); },
		number(ctx) {
			let args = [];
			if (ctx.params.max)
				args.push(ctx.params.max);
			if (ctx.params.min)
				args.push(ctx.params.min);
			return this.generate(ctx, "random.number", args);
		},
		digit(ctx) 			{ return this.generate(ctx, "random.digit"); },
		letter(ctx) 		{ return this.generate(ctx, "random.letter"); },
		arrayElement(ctx) 	{ return this.generate(ctx, "random.arrayElement", [ctx.params.array]); },
		objectElement(ctx) 	{ return this.generate(ctx, "random.objectElement", [ctx.params.object]); },
		masked(ctx) 		{ return this.generate(ctx, "random.masked", [ctx.params.mask]); },
		hex(ctx) 			{ return this.generate(ctx, "random.hex", [ctx.params.length]); },
		string(ctx) 		{ return this.generate(ctx, "random.string", [ctx.params.length]); },

		name(ctx) 			{ return this.generate(ctx, "names.name"); },
		nameM(ctx) 			{ return this.generate(ctx, "names.nameM"); },
		nameF(ctx) 			{ return this.generate(ctx, "names.nameF"); },
		firstName(ctx) 		{ return this.generate(ctx, "names.firstName"); },
		firstNameM(ctx) 	{ return this.generate(ctx, "names.firstNameM"); },
		firstNameF(ctx) 	{ return this.generate(ctx, "names.firstNameF"); },
		lastName(ctx) 		{ return this.generate(ctx, "names.lastName"); },
		lastNameM(ctx) 		{ return this.generate(ctx, "names.lastNameM"); },
		lastNameF(ctx) 		{ return this.generate(ctx, "names.lastNameF"); },
		prefix(ctx) 		{ return this.generate(ctx, "names.prefix"); },
		suffix(ctx) 		{ return this.generate(ctx, "names.suffix"); },

		country(ctx) 		{ return this.generate(ctx, "address.country"); },
		countryCode(ctx) 	{ return this.generate(ctx, "address.countryCode"); },
		countryAndCode(ctx) { return this.generate(ctx, "address.countryAndCode"); },
		city(ctx) 			{ return this.generate(ctx, "address.city"); },
		street(ctx) 		{ return this.generate(ctx, "address.street"); },
		streetName(ctx) 	{ return this.generate(ctx, "address.streetName"); },
		buildingNumber(ctx) { return this.generate(ctx, "address.buildingNumber"); },
		postCode(ctx) 		{ return this.generate(ctx, "address.postCode"); },
		geoLocation(ctx) 	{ return this.generate(ctx, "address.geoLocation"); },
		altitude(ctx) 		{ return this.generate(ctx, "address.altitude"); },

		phoneNumber(ctx) 	{ return this.generate(ctx, "phone.number"); },

		companyName(ctx) 	{ return this.generate(ctx, "company.name"); },
		companySuffix(ctx) 	{ return this.generate(ctx, "company.suffix"); },

		userName(ctx) 		{ return this.generate(ctx, "internet.userName", [ctx.params.firstName, ctx.params.lastName]); },
		password(ctx) 		{ return this.generate(ctx, "internet.password"); },
		domain(ctx) 		{ return this.generate(ctx, "internet.domain"); },
		url(ctx) 			{ return this.generate(ctx, "internet.url"); },
		email(ctx) 			{ return this.generate(ctx, "internet.email", [ctx.params.firstName, ctx.params.lastName]); },
		image(ctx) 			{ return this.generate(ctx, "internet.image", [ctx.params.width, ctx.params.height, ctx.params.category]); },
		mac(ctx) 			{ return this.generate(ctx, "internet.mac"); },
		ip(ctx) 			{ return this.generate(ctx, "internet.ip"); },
		ipv6(ctx) 			{ return this.generate(ctx, "internet.ipv6"); },
		color(ctx) 			{ return this.generate(ctx, "internet.color"); },
		avatar(ctx) 		{ return this.generate(ctx, "internet.avatar"); },
		gravatar(ctx) 		{ return this.generate(ctx, "internet.gravatar", [ctx.params.email]); },

		word(ctx) 			{ return this.generate(ctx, "lorem.word"); },
		sentence(ctx) 		{ return this.generate(ctx, "lorem.sentence"); },
		paragraph(ctx) 		{ return this.generate(ctx, "lorem.paragraph"); },

		uuid(ctx) 			{ return this.generate(ctx, "misc.uuid"); },

		user(ctx) 			{ return this.generate(ctx, "entity.user", [ctx.params.gender]); },
		address(ctx) 		{ return this.generate(ctx, "entity.address"); },
		company(ctx) 		{ return this.generate(ctx, "entity.company"); },
		post(ctx) 			{ return this.generate(ctx, "entity.post"); },

		populate(ctx) 		{ return this.generate(ctx, "populate", [ctx.params.template]); },
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate fake data
		 *
		 * @param {any} ctx
		 * @returns {Promise}
		 */
		generate(ctx, type, args = []) {
			let fakerator = this.fakerator;
			if (ctx.params.locale && ctx.params.locale != this.settings.locale)
				fakerator = this.getFakerator(ctx.params.locale);

			const fn = _.get(fakerator, type);
			if (fn) {
				if (ctx.params.utimes)
					return fakerator.utimes(fn, ctx.params.utimes, ...args);
				else if (ctx.params.times)
					return fakerator.times(fn, ctx.params.times, ...args);
				else
					return fn(...args);
			} else
				/* istanbul ignore next */
				return this.Promise.reject(new Error("Invalid type: " + type));
		},

		getFakerator(locale) {
			if (this.fakerators[locale])
				return this.fakerators[locale];

			// Create a new instance by localeuage
			const fakerator = Fakerator(locale);
			if (this.settings.seed)
				fakerator.seed(this.settings.seed);

			this.fakerators[locale] = fakerator;

			return fakerator;
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.fakerators = [];

		this.fakerator = this.getFakerator(this.settings.locale);
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}
};
