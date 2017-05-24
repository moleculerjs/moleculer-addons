![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-fake [![NPM version](https://img.shields.io/npm/v/moleculer-fake.svg)](https://www.npmjs.com/package/moleculer-fake)

Fake data generator by [Fakerator](https://github.com/icebob/fakerator)

## Install
```
npm install moleculer-fake --save
```

## Usage

```js
"use strict";

const { ServiceBroker } = require("moleculer");

const broker = new ServiceBroker();

broker.createService(require("moleculer-fake"), { settings: { lang: "hu-HU" }});

// Generate 5 numbers between 0 and 20
broker.call("fake.number", { max: 20, times: 5 }).then(console.log);
/* Result: [ 18, 4, 16, 11, 11 ] */

// Generate 5 unique number between 0 and 10
broker.call("fake.number", { max: 10, utimes: 5 }).then(console.log);
/* Result: [ 5, 1, 4, 8, 0 ] */

// Generate a user name in a specified locale
broker.call("fake.name", { locale: "ru-RU"}).then(console.log);
/* Result: "Лобанова Матвей Николаевна" */

// Generate a complete user object
broker.call("fake.user").then(console.log);
/* Result:
	{ 
		firstName: 'Marsha',
		lastName: 'Berge',
		userName: 'marsha_berge35',
		password: 'huhefehuje',
		email: 'marsha.berge@yahoo.com',
		phone: '319.071.6645 x2269',
		dob: 2005-04-07T17:10:26.030Z,
		website: 'http://laurence.biz',
		ip: '236.82.114.84',
		avatar: 'https://s3.amazonaws.com/uifaces/faces/twitter/guillemboti/128.jpg',
		gravatar: 'https://www.gravatar.com/avatar/c89beff0132a6eaad9d03e9058b5378e',
		address: 
		{ country: 'Tristan da Cunha',
			countryCode: 'TA',
			state: 'Utah',
			city: 'Carrollview',
			street: '317 Veum Lakes Apt. 459',
			zip: '10032',
			geo: { latitude: -57.1798, longitude: -64.1921 } },
		status: false
	}
*/

```

## Settings
| Property | Description |
| -------- | ----------- |
| `locale` | Initial locale to Fakerator (Available values: `cs-CZ`, `de-DE`, `en-AU`, `en-CA`, `es-ES`, `fr-FR`, `hu-HU`, `it-IT`, `nb-NO`, `pl-PL`, `ru-RU`, `sk-SK`, `sv-SE`) |
| `seed` | Initial seed value to Fakerator |

## Actions
| Name | Params | Result | Description |
| ---- | ------ | ------ | ----------- |
| `fake.boolean` | `likelihoodPercent` | `Boolean` | Generate a random boolean |
| `fake.number` | `min`, `max` | `Number` | Generate a random number |
| `fake.digit` | - | `Number` | Generate a digit (0..9) |
| `fake.letter` | - | ``String`` | Generate a letter (a..z) |
| `fake.arrayElement` | `array` | `any` | Give a random element from the array |
| `fake.objectElement` | `object` | `Object` | Give a random `{ key: value }` from the object |
| `fake.masked` | `mask` | `String` | Generate a masked string ( a - lowercase letter, A - uppercase letter, 9 - digit, * - letter or digit) |
| `fake.hex` | `length` | `String` | Generate a random hexadecimal number |
| `fake.string` | `length` | `String` | Generate a random string |
| `fake.name` | - | `String` | Generate a full name |
| `fake.nameM` | - | `String` | Generate a male full name (*) |
| `fake.nameF` | - | `String` | Generate a female full name (*) |
| `fake.firstName` | - | `String` | Generate a first name |
| `fake.firstNameM` | - | `String` | Generate a male first name (*) |
| `fake.firstNameF` | - | `String` | Generate a female first name (*) |
| `fake.lastName` | - | `String` | Generate a last name |
| `fake.lastNameM` | - | `String` | Generate a male last name (*) |
| `fake.lastNameF` | - | `String` | Generate a female last name (*) |
| `fake.prefix` | - | `String` | Generate a name prefix |
| `fake.suffix` | - | `String` | Generate a name suffix |
| `fake.` | - | `String` | Generate a name suffix |
| `fake.country` | - | `String` | Give a random country name |
| `fake.countryCode` | - | `String` | Give a random country code |
| `fake.countryAndCode` | - | `Object` | Give a random country object |
| `fake.city` | - | `String` | Give a random city |
| `fake.street` | - | `String` | Give a random street address |
| `fake.streetName` | - | `String` | Give a random street name |
| `fake.buildingNumber` | - | `String` | Give a random building number |
| `fake.postCode` | - | `String` | Give a random post code |
| `fake.geoLocation` | - | `Object` | Give a random geolocation |
| `fake.altitude` | - | `String` | Give a random altitude |
| `fake.phoneNumber` | - | `String` | Generate a random phone number |
| `fake.companyName` | - | `String` | Generate a random company name |
| `fake.companySuffix` | - | `String` | Generate a random company name suffix |
| `fake.companySuffix` | - | `String` | Generate a random company name suffix |
| `fake.userName` | `firstName`, `lastName` | `String` | Generate a random username |
| `fake.password` | - | `String` | Generate a random password |
| `fake.domain` | - | `String` | Generate a domain name |
| `fake.url` | - | `String` | Generate an URL |
| `fake.email` | `firstName`, `lastName` | `String` | Generate an email address |
| `fake.image` | `width`, `height`, `category` | `String` | Generate an image URL |
| `fake.mac` | - | `String` | Generate a MAC address |
| `fake.ip` | - | `String` | Generate an IPv4 address |
| `fake.ipv6` | - | `String` | Generate an IPv6 address |
| `fake.color` | - | `String` | Generate a random color |
| `fake.avatar` | - | `String` | Give a random avatar URL |
| `fake.gravatar` | `email` | `String` | Generate a gravatar URL |
| `fake.word` | - | `String` | Give a random word |
| `fake.sentence` | - | `String` | Generate a sentence |
| `fake.paragraph` | - | `String` | Generate a paragraph |
| `fake.uuid` | - | `String` | Generate an UUID |
| `fake.user` | `gender` | `String` | Generate a User entity |
| `fake.address` | - | `String` | Generate an Address entity |
| `fake.company` | - | `String` | Generate a Company entity |
| `fake.post` | - | `String` | Generate a Post entity |
| `fake.populate` | `template` | `String` | Populate a template string |

> (*) - if supported by localization

# Test
```
$ npm test
```

In development with watching

```
$ npm run ci
```

# Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2016-2017 Ice Services

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
