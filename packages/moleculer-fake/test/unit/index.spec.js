"use strict";

const _ = require("lodash");
const { ServiceBroker } = require("moleculer");
const FakeService = require("../../src");

describe("Test FakeService", () => {
	let broker;
	let service;

	beforeEach(() => {
		broker = new ServiceBroker({ logger: false});
		service = broker.createService(FakeService, {
			settings: {
				seed: 4278
			}
		});

		return broker.start();
	});

	afterEach(() => broker.stop());

	it("should be created", () => {
		expect(service).toBeDefined();
		expect(service.fakerator).toBeDefined();
	});

	it("should be create with language from settings", () => {
		const broker = new ServiceBroker({ logger: false});
		broker.createService(FakeService, {
			settings: {
				seed: 5555,
				locale: "it-IT"
			}
		});
		return broker.start()
			.then(() => expect(broker.call("fake.name")).resolves.toBe("Lino Marini"));
	});

	it("should create langs only once", () => {
		expect(Object.keys(service.fakerators).length).toBe(1);
		return broker.call("fake.name", { locale: "hu-HU" })
			.then(res => {
				expect(res).toBe("Sipos József");
				return broker.call("fake.name", { locale: "hu-HU" });
			})
			.then(res => {
				expect(res).toBe("Illés Márta");
				expect(Object.keys(service.fakerators).length).toBe(2);
			});
	});

	describe("Test languages", () => {
		it("Test default language", () => expect(broker.call("fake.name")).resolves.toBe("Ross Hansen"));
		it("Test de-DE language", () => expect(broker.call("fake.name", { locale: "de-DE" })).resolves.toBe("Caitlin Balzer"));
		it("Test ru-RU language", () => expect(broker.call("fake.name", { locale: "ru-RU" })).resolves.toBe("Хохлов Владислав"));
		it("Test hu-HU language", () => expect(broker.call("fake.name", { locale: "hu-HU" })).resolves.toBe("Sipos József"));
	});

	describe("Test times", () => {
		it("Test with numbers", () => expect(broker.call("fake.number", { times: 5, max: 10 })).resolves.toEqual([5, 5, 6, 3, 0]));
		it("Test with names", () => expect(broker.call("fake.name", { times: 5 })).resolves.toEqual(["Ross Hansen", "Thomas Pfeffer", "Alexis Hauck I", "Mr. Ignacio Stoltenberg", "Elijah White PhD"]));
	});

	describe("Test utimes", () => {
		it("Test with numbers", () => expect(broker.call("fake.number", { utimes: 5, max: 10 })).resolves.toEqual([5, 6, 3, 0, 7]));
	});

	describe("Test actions", () => {

		const testMatrix = [

			// Random
			{ action: "fake.boolean", expect: true },
			{ action: "fake.boolean", params: { likelihoodPercent: 5 }, expect: false },

			{ action: "fake.number", expect: 4976 },
			{ action: "fake.number", params: { max: 20 }, expect: 10 },
			{ action: "fake.number", params: { min: 5, max: 10 }, expect: 7 },

			{ action: "fake.digit", expect: 4 },
			{ action: "fake.letter", expect: "m" },
			{ action: "fake.arrayElement", params: { array: ["yes", "no"] }, expect: "yes" },
			{ action: "fake.objectElement", params: { object: {id: 1, name: "John" }}, expect: {"id": 1} },
			{ action: "fake.masked", params: { mask: "aaa-AAA-999 ***" }, expect: "mlo-IAQ-066 9wc" },
			{ action: "fake.hex", params: { length: 10 }, expect: "77950a0b94" },
			{ action: "fake.string", params: { length: 12 }, expect: "mloiaqarpgxi" },

			// Names
			{ action: "fake.name", expect: "Ross Hansen" },
			{ action: "fake.nameM", expect: "Erik MacGyver" },
			{ action: "fake.nameF", expect: "Georgia MacGyver" },
			{ action: "fake.firstName", expect: "Erik" },
			{ action: "fake.firstNameM", expect: "Kurt" },
			{ action: "fake.firstNameF", expect: "Dora" },
			{ action: "fake.lastName", expect: "Koelpin" },
			{ action: "fake.lastNameM", expect: "Kunze" },
			{ action: "fake.lastNameF", expect: "Kunze" },
			{ action: "fake.prefix", expect: "Ms." },
			{ action: "fake.suffix", expect: "IV" },

			// Address
			{ action: "fake.country", expect: "Lesotho" },
			{ action: "fake.countryCode", expect: "LS" },
			{ action: "fake.countryAndCode", expect: {"code": "LS", "name": "Lesotho"} },
			{ action: "fake.city", expect: "South Joann" },
			{ action: "fake.street", expect: "5306 Lindsay Forges" },
			{ action: "fake.streetName", expect: "Ross Heights" },
			{ action: "fake.buildingNumber", expect: "4530" },
			{ action: "fake.postCode", expect: "45306" },
			{ action: "fake.geoLocation", expect: {"latitude": -0.4205999999999932, "longitude": -14.090599999999995} },
			{ action: "fake.altitude", expect: 4403 },

			// Phone
			{ action: "fake.phoneNumber", expect: "(453) 060-6629 x321" },

			// Company
			{ action: "fake.companyName", expect: "MacGyver-Barrows LLC" },
			{ action: "fake.companySuffix", expect: "Corp." },

			// Internet
			{ action: "fake.userName", expect: "erik.hansen" },
			{ action: "fake.userName", params: { firstName: "John", lastName: "Doe" }, expect: "john_doe" },
			{ action: "fake.password", params: { length: 8 }, expect: jasmine.any(String) },
			{ action: "fake.domain", expect: "rossbarrows.info" },
			{ action: "fake.url", expect: "https://donaldaufderhar.info" },
			{ action: "fake.email", expect: "erikhansen06@gmail.com" },
			{ action: "fake.email", params: { firstName: "John", lastName: "Doe" }, expect: "john.doe53@yahoo.com" },
			{ action: "fake.image", expect: "http://lorempixel.com/640/480" },
			{ action: "fake.mac", expect: "77:95:0a:0b:94:e5" },
			{ action: "fake.ip", expect: "127.118.144.84" },
			{ action: "fake.ipv6", expect: "7795:0a0b:94e5:3202:ed02:ffd0:49ab:86fd" },
			{ action: "fake.color", expect: "3f3b48" },
			{ action: "fake.avatar", expect: "https://s3.amazonaws.com/uifaces/faces/twitter/derekcramer/128.jpg" },
			{ action: "fake.gravatar", expect: "https://www.gravatar.com/avatar/2676ada503dacf4695547679c79b7809" },
			{ action: "fake.gravatar", params: { email: "john.doe@gmail.com" }, expect: "https://www.gravatar.com/avatar/e13743a7f1db7f4246badd6fd6ff54ff" },

			// Lorem
			{ action: "fake.word", expect: "dolores" },
			{ action: "fake.sentence", expect: "Praesentium error voluptas accusantium rerum sit." },
			{ action: "fake.paragraph", expect: "Error voluptas accusantium rerum sit est. Magnam repudiandae laboriosam labore ipsum voluptatem dolorem. Eos eaque sit voluptatibus hic nulla perferendis nostrum error quidem. Quas iusto sapiente et ut magni tenetur molestias." },

			// Misc
			{ action: "fake.uuid", expect: jasmine.any(String) },

			// Entity
			{ action: "fake.user", expect: {"address": {"city": "Lake Wayneland", "country": "South Georgia & South Sandwich Islands", "countryCode": "GS", "geo": {"latitude": 41.6438, "longitude": 109.85270000000003}, "state": "Delaware", "street": "310 Rickey Creek Apt. 683", "zip": "44474-4318"}, "avatar": "https://s3.amazonaws.com/uifaces/faces/twitter/lebronjennan/128.jpg", "dob": jasmine.any(Date), "email": "erik.hansen@yahoo.com", "firstName": "Erik", "gravatar": "https://www.gravatar.com/avatar/820eecf59246afdd81170f4bebedb895", "ip": "221.60.34.243", "lastName": "Hansen", "password": jasmine.any(String), "phone": "(629) 321-0188 x0199", "status": false, "userName": "erik.hansen", "website": "https://luzkerluke.co"} },
			{ action: "fake.user", params: { gender: "F" }, expect: {"address": {"city": "Schinnerville", "country": "Niue", "countryCode": "NU", "geo": {"latitude": 62.5325, "longitude": -53.179199999999994}, "state": "Maine", "street": "411 Hoppe Dale", "zip": "12616"}, "avatar": "https://s3.amazonaws.com/uifaces/faces/twitter/scottfeltham/128.jpg", "dob": jasmine.any(Date), "email": "dora.koelpin@gmail.com", "firstName": "Dora", "gravatar": "https://www.gravatar.com/avatar/a2cb08d975390b5abef0c7389d3f510e", "ip": "178.129.111.245", "lastName": "Koelpin", "password": jasmine.any(String), "phone": "066-293-2101 x8801", "status": true, "userName": "dora_koelpin", "website": "http://www.ross.info"} },
			{ action: "fake.address", expect: {"city": "Donaldfurt", "country": "Lesotho", "countryCode": "LS", "geo": {"latitude": 80.6447, "longitude": 124.2627}, "state": "Mississippi", "street": "629 Ernest Brook", "zip": "88019"} },
			{ action: "fake.company", expect: {"address": {"city": "Fayfurt", "country": "Liechtenstein", "countryCode": "LI", "geo": {"latitude": -62.667500000000004, "longitude": -74.3886}, "state": "Louisiana", "street": "971 Eileen Crossroad", "zip": "69310"}, "email": "macgyver-barrows-llc.pfeffer93@yahoo.com", "ip": "221.60.34.243", "name": "MacGyver-Barrows LLC", "phone": "101-880-1998", "website": "https://luzkerluke.co"} },
			{ action: "fake.post", expect: jasmine.any(Object) },

			{ action: "fake.populate", params: { template: "Hi, my name is #{names.name}. I was born in #{address.city}, #{address.country}. I am #{date.age} years old." }, expect: "Hi, my name is Ross Hansen. I was born in New Roderickstad, Denmark. I am 75 years old." },
		];

		testMatrix.forEach(t => {
			it(`"call '${t.action}'`, () => broker.call(t.action, t.params).then(res => expect(res).toEqual(t.expect)));
		});

	});

});

