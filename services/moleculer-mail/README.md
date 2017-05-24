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

**Send an HTML e-mail with `sendmail`**
```js
"use strict";

const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

// Load service
broker.createService(require("moleculer-mail"), {
    from: "sender@moleculer.services"
});

// Send an e-mail
broker.call("mail.send", { 
    to: "john.doe@example.org", 
    subject: "Hello Friends!", 
    html: "This is the <b>content</b>!"
}).then(console.log);
```

**Send an e-mail with mailgun**
```js
// Load service
broker.createService(require("moleculer-mail"), {
    transport: {
        type: "mailgun",
        options: {
            auth: {
                api_key: 'api12345',
                domain: 'domain.com'
            }
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

## Settings
| Property | Type | Description |
| -------- | -----| ----------- |
| `sender` | `String` | Sender's email address |
| `transport` | `Object` | Transport settings |
| `transport.type` | `String` | Type of transport. `sendmail`, `smtp`, `mailgun`, `sendgrid` |
| `transport.options` | `Object` | Transport settings. Pass to transport contructor |
| `htmlToText` | `Boolean` | Enable html-to-text conversion |

### Transport options

#### Sendmail
```js
transport: {
    type: "sendmail",
    options: {
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
    }
}
```

#### SMTP
```js
transport: {
    type: "smtp",
    options: {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "",
            pass: ""
        }
    }
}
```

#### Mailgun
```js
transport: {
    type: "mailgun",
    options: {
        auth: {
            api_key: '',
            domain: ''
        }
    }
}
```

#### Sendgrid
```js
transport: {
    type: "sendgrid",
    options: {
        auth: {
            api_key: ""
        }
    }
}
```


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

# TODO
- handle templates (settings.templateFolder: "") 
    - read files (pug,ejs) and transform with consolidate.js
    - mail.call params: `template: "welcome"` will use the `welcome.pug` file and run the render with `data` object.

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2016-2017 Ice Services

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
