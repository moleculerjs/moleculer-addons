![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-twilio [![NPM version](https://img.shields.io/npm/v/moleculer-twilio.svg)](https://www.npmjs.com/package/moleculer-twilio)

Send SMS using Twilio API.

# Install

```bash
$ npm install moleculer-twilio --save
```

# Usage

> Before use please set the `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_PHONE_NUMBER` environment variables.

```js
let { ServiceBroker } 	= require("moleculer");
let SmsService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({ logger: console });

// Load my service
broker.createService({
	name: "twilio",
	mixins: [SmsService],
	settings: {
		phoneNumber: "+15005550006"
	}
});

// Start server
broker.start().then(() => {

	broker
		.call("twilio.send", { to: "+14108675309", message: "Hello Twilio!" })
		.then(sms => console.log("SMS Sid:", sms.sid))
		.catch(console.error);

});
```

# Settings

<!-- AUTO-CONTENT-START:SETTINGS -->
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `accountSid` | `String` | **required** | Twilio account Sid. Visit your [Twilio dashboard\'s]((https://www.twilio.com/console/voice/dashboard)) main page. Click "Show API Credentials", then copy and paste your "ACCOUNT SID". |
| `authToken` | `String` | **required** | Twilio auth token. Visit your [Twilio dashboard\'s]((https://www.twilio.com/console/voice/dashboard)) main page. Click "Show API Credentials", then copy and paste your "AUTH TOKEN". |
| `phoneNumber` | `String` | **required** | This is the 'From' phone number you'd like to use to send the SMS. This phone number is assigned to you by [Twilio](https://www.twilio.com/console/phone-numbers/incoming). |

<!-- AUTO-CONTENT-END:SETTINGS -->

<!-- AUTO-CONTENT-TEMPLATE:SETTINGS
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
{{#each this}}
| `{{name}}` | {{type}} | {{defaultValue}} | {{description}} |
{{/each}}
{{^this}}
*No settings.*
{{/this}}

-->

# Actions
<!-- AUTO-CONTENT-START:ACTIONS -->
## `send` 

Send an SMS

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `to` | `String` | **required** | Target phone number |
| `message` | `String` | **required** | Message text |
| `mediaUrl` | `String` | - | Media URL |

### Results
**Type:** `String`




<!-- AUTO-CONTENT-END:ACTIONS -->

<!-- AUTO-CONTENT-TEMPLATE:ACTIONS
{{#each this}}
## `{{name}}` {{#each badges}}{{this}} {{/each}}
{{#since}}
_<sup>Since: {{this}}</sup>_
{{/since}}

{{description}}

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
{{#each params}}
| `{{name}}` | {{type}} | {{defaultValue}} | {{description}} |
{{/each}}
{{^params}}
*No input parameters.*
{{/params}}

{{#returns}}
### Results
**Type:** {{type}}

{{description}}
{{/returns}}

{{#hasExamples}}
### Examples
{{#each examples}}
{{this}}
{{/each}}
{{/hasExamples}}

{{/each}}
-->

# Methods

<!-- AUTO-CONTENT-START:METHODS -->
## `sendSMS` 

Send an SMS

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `to` | `String` | **required** | Target phone number |
| `body` | `String` | `"\"\""` | Body of SMS |
| `mediaUrl` | `String` | - | Media URL |

### Results
**Type:** `String`




<!-- AUTO-CONTENT-END:METHODS -->

<!-- AUTO-CONTENT-TEMPLATE:METHODS
{{#each this}}
## `{{name}}` {{#each badges}}{{this}} {{/each}}
{{#since}}
_<sup>Since: {{this}}</sup>_
{{/since}}

{{description}}

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
{{#each params}}
| `{{name}}` | {{type}} | {{defaultValue}} | {{description}} |
{{/each}}
{{^params}}
*No input parameters.*
{{/params}}

{{#returns}}
### Results
**Type:** {{type}}

{{description}}
{{/returns}}

{{#hasExamples}}
### Examples
{{#each examples}}
{{this}}
{{/each}}
{{/hasExamples}}

{{/each}}
-->

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
