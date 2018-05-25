![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-slack [![NPM version](https://img.shields.io/npm/v/moleculer-slack.svg)](https://www.npmjs.com/package/moleculer-slack)

Send Messages to Slack API.

# Install

```bash
$ npm install moleculer-slack --save
```

# Usage

> Before use please set the `SLACK_TOKEN` and `SLACK_CHANNEL` environment variables.

```js
let { ServiceBroker }     = require("moleculer");
let SlackService             = require("../../index");

// Create broker
let broker = new ServiceBroker({ logger: console });

// Load my service
broker.createService({
    name: "slack",
    mixins: [SlackService],
    settings: {
        text: "Hello slack"
    }
});

// Start server
broker.start().then(() => {

    broker
        .call("slack.send", { message: "Hello Slack!" })
        .then(res => console.log("Slack message sent. Sid:", res.ts))
        .catch(console.error);

});
```

# Settings

<!-- AUTO-CONTENT-START:SETTINGS -->
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `slackToken` | `String` | **required** | Slack API Token. Visit your [Slack App dashboard's](https://www.slack.com/apps) main page. Click "Create App, Generate Token", then copy and paste your "API TOKEN" here. |
| `slackChannel` | `String` | **required** | Slack API Token. Visit your [Slack App dashboard's](https://www.slack.com/apps) main page. Add incoming webhook and create/select a channel, then copy and paste here. |

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

Send a Slack Message

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `message` | `String` | **required** | Message text |

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
## `sendMessage` 

Send a slack message

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `message` | `String` | - | Body of the message |

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
