![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-bee-queue [![NPM version](https://img.shields.io/npm/v/moleculer-bee-queue.svg)](https://www.npmjs.com/package/moleculer-bee-queue)

Task queue mixin for [Bee-Queue](https://github.com/bee-queue/bee-queue).

# Install

```bash
$ npm install moleculer-bee-queue --save
```

# Usage

## Create queue worker service
```js
const QueueService = require("moleculer-bee-queue");

broker.createService({
    name: "task-worker",
    mixins: [QueueService()],

    queues: {
        "mail.send"(job) {
            this.logger.info("New job received!", job.data);
            job.reportProgress(10);

            return this.Promise.resolve({
                done: true,
                id: job.data.id,
                worker: process.pid
            });
        }
    }
});
```

## Create job in service
```js
const QueueService = require("moleculer-bee-queue");

broker.createService({
    name: "job-maker",
    mixins: [QueueService()],

    methods: {
        sendEmail(data) {
            const job = this.createJob("mail.send", payload);

            job.on("progress", progress => {
                this.logger.info(`Job #${job.id} progress is ${progress}%`);
            });

            job.on("succeeded", res => {
                this.logger.info(`Job #${job.id} completed!. Result:`, res);
            });

            job.retries(2).save();
        }
    }
});
```

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
Copyright (c) 2016-2017 MoleculerJS

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
