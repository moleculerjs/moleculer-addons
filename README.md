![Moleculer logo](http://moleculer.services/images/banner.png)

[![Build Status](https://travis-ci.org/moleculerjs/moleculer-addons.svg?branch=master)](https://travis-ci.org/moleculerjs/moleculer-addons)
[![Coverage Status](https://coveralls.io/repos/github/moleculerjs/moleculer-addons/badge.svg?branch=master)](https://coveralls.io/github/moleculerjs/moleculer-addons?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/78a7ba63c8af4ee7904e851101733628)](https://www.codacy.com/app/mereg-norbert/moleculer-addons?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=moleculerjs/moleculer-addons&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/f43cf5bdbea79cb98a75/maintainability)](https://codeclimate.com/github/moleculerjs/moleculer-addons/maintainability)
[![Known Vulnerabilities](https://snyk.io/test/github/moleculerjs/moleculer-addons/badge.svg)](https://snyk.io/test/github/moleculerjs/moleculer-addons)
[![Join the chat at https://gitter.im/moleculerjs/moleculer](https://badges.gitter.im/moleculerjs/moleculer.svg)](https://gitter.im/moleculerjs/moleculer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Official addons for Moleculer framework
This is a monorepo, contains multiple services & addons for Moleculer project.

<!-- AUTO-GENERATED-CONTENT:START (RENDERLIST:folder=packages&title=Generals) -->
## Generals
| Name | Version | Description |
| ---- | ------- | ----------- |
| [moleculer-bee-queue](/packages/moleculer-bee-queue#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-bee-queue.svg)](https://www.npmjs.com/package/moleculer-bee-queue) | Task queue mixin for Bee-Queue |
| [moleculer-bull](/packages/moleculer-bull#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-bull.svg)](https://www.npmjs.com/package/moleculer-bull) | Task queue service with Bull |
| [moleculer-elasticsearch](/packages/moleculer-elasticsearch#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-elasticsearch.svg)](https://www.npmjs.com/package/moleculer-elasticsearch) | Elasticsearch service for Moleculer. |
| [moleculer-fake](/packages/moleculer-fake#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-fake.svg)](https://www.npmjs.com/package/moleculer-fake) | Fake data generator by Fakerator |
| [moleculer-mail](/packages/moleculer-mail#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-mail.svg)](https://www.npmjs.com/package/moleculer-mail) | Send emails |
| [moleculer-slack](/packages/moleculer-slack#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-slack.svg)](https://www.npmjs.com/package/moleculer-slack) | Send Messages to slack |
| [moleculer-twilio](/packages/moleculer-twilio#readme) | [![NPM version](https://img.shields.io/npm/v/moleculer-twilio.svg)](https://www.npmjs.com/package/moleculer-twilio) | Send SMS Message with Twilio. |
<!-- AUTO-GENERATED-CONTENT:END -->

# Contribution

## Install dependencies
```bash
$ npm run setup
```

## Development
**Run the `simple` example in `moleculer-mail` service with watching**
```bash
$ npm run dev moleculer-mail
```

**Run the `full` example in `moleculer-fake` service w/o watching**
```bash
$ npm run demo moleculer-fake full
```

## Test
```bash
$ npm test
```

## Create a new addon
```bash
$ npm run init moleculer-<modulename>
```

## Publish new releases
```bash
$ npm run release
```

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2016-2019 MoleculerJS

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
