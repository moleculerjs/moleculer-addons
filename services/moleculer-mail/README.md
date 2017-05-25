![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-mail [![NPM version](https://img.shields.io/npm/v/moleculer-mail.svg)](https://www.npmjs.com/package/moleculer-mail)

Send emails with [nodemailer](https://nodemailer.com/about/). Support localized templates.

## Features
- [30+ pre-configures services (Gmail, Hotmail, Mailgun Sendgrid...etc)](https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json)
- HTML and Text messages with attachments
- html-to-text conversion
- e-mail templates with localization
- [30+ supported HTML template engines (handlebars, pug, haml, ejs, ...etc)](https://github.com/crocodilejs/node-email-templates#supported-template-engines)

## Install

```bash
$ npm install moleculer-mail --save
```
or
```bash
$ yarn add moleculer-mail
```

## Usage

**Send an HTML e-mail with Gmail**
```js
"use strict";

const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

// Load service
broker.createService(require("moleculer-mail"), {
    from: "sender@moleculer.services",
    transport: {
        service: 'gmail',
        auth: {
            user: 'gmail.user@gmail.com',
            pass: 'yourpass'
        }
    }
});

// Send an e-mail
broker.call("mail.send", { 
    to: "john.doe@example.org", 
    subject: "Hello Friends!", 
    html: "This is the <b>content</b>!"
}).then(console.log);
```

**Send an e-mail with mailgun with Cc & Bcc**
```js
// Load service
broker.createService(require("moleculer-mail"), {
    transport: {
        service: "mailgun",
        auth: {
            api_key: 'api12345',
            domain: 'domain.com'
        }
    }
});

// Send an e-mail to some people
broker.call("mail.send", { 
    to: "john.doe@example.org", 
    cc: "jane.doe@example.org",
    bcc: "boss@example.org",
    subject: "Hello Friends!", 
    text: "This is a text only message!"
}).then(console.log);
```


**Send an e-mail from template**
```js
// Load service
broker.createService(require("moleculer-mail"), {
    transport: {
        type: "sendmail"
    },
    templateFolder: "./email-templates"
});

// Send a welcome template
broker.call("mail.send", { 
    to: "john.doe@example.org", 
    template: "welcome",
    locale: "de-DE",
    data: {
        name: "John Doe",
        username: "john_doe",
        verifyToken: "123456"
    }
});
```

## Settings
| Property | Type | Description |
| -------- | -----| ----------- |
| `sender` | `String` | Sender's email address |
| `transport` | `Object` | Transport settings. Send to `nodemailer`  |
| `htmlToText` | `Boolean` | Enable html-to-text conversion |
| `templateFolder` | `String` | Path to template folder |

### Transport options
[Read more from transport options](https://nodemailer.com/smtp/)

### Localized templates
The service support templates. It uses [email-templates](https://github.com/crocodilejs/node-email-templates) library. The templates is rendered by [consolidate.js](https://www.npmjs.com/package/consolidate), so you can use many template engines.

Read more about [template files](https://github.com/crocodilejs/node-email-templates#quick-start).

Read more about [localized templates](https://github.com/crocodilejs/node-email-templates#localized-template) or check the [examples](examples/template) folder.

## Actions
| Name | Params | Result | Description |
| ---- | ------ | ------ | ----------- |
| `mail.send` | [Any field from here](https://nodemailer.com/message/) | [`Object`](https://nodemailer.com/usage/#sending-mail) | Send an email. |

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
