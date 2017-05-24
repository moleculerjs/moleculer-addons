![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-mail [![NPM version](https://img.shields.io/npm/v/moleculer-mail.svg)](https://www.npmjs.com/package/moleculer-mail)

Send emails with [nodemailer](https://nodemailer.com/about/)

## Features
- multiple transports (smtp, sendmail, mailgun, sendgrid)
- HTML and Text messages
- html-to-text conversion

## Install

```bash
$ npm install moleculer-mail --save
```
or
```bash
$ yarn add moleculer-mail
```

## Usage

```js
"use strict";

const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

// Load service
broker.createService(require("moleculer-mail"));

// Call
broker.call("mailer.xyz", {}).then(console.log);
/* Result: ??? */

```

## Settings
| Property | Type | Description |
| -------- | -----| ----------- |
| `sender` | `String` | Sender's email address |
| `transport` | `Object` | Transport settings |
| `transport.type` | `String` | Type of transport. `sendmail`, `smtp`, `mailgun`, `sendgrid` |
| `transport.options` | `Object` | Transport settings. Pass to transport contructor |
| `htmlToText` | `Boolean` | Enable html-to-text conversion |

## Actions
| Name | Params | Result | Description |
| ---- | ------ | ------ | ----------- |
| `mail.send` | `recipients`, `subject`, `html`?, `text`?, `sender`? | `Object` | Send an email. |

# Test
```
$ npm test
```

In development with watching

```
$ npm run ci
```

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2016-2017 Ice Services

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
