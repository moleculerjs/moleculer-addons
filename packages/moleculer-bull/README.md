![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-bull [![NPM version](https://img.shields.io/npm/v/moleculer-bull.svg)](https://www.npmjs.com/package/moleculer-bull)

Task queue mixin for [Bull](https://github.com/OptimalBits/bull).

# Install

```bash
$ npm install moleculer-bull --save
```

# Usage

## Create queue worker service
```js
const QueueService = require("moleculer-bull");

broker.createService({
    name: "task-worker",
    mixins: [QueueService()],

    queues: {
        "mail.send"(job) {
            this.logger.info("New job received!", job.data);
            job.progress(10);

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
const QueueService = require("moleculer-bull");

broker.createService({
    name: "job-maker",
    mixins: [QueueService()],

    methods: {
        sendEmail(data) {
            this.createJob("mail.send", payload);

            this.getQueue("mail.send").on("global:progress", (jobID, progress) => {
                this.logger.info(`Job #${jobID} progress is ${progress}%`);
            });

            this.getQueue("mail.send").on("global:completed", (job, res) => {
                this.logger.info(`Job #${job.id} completed!. Result:`, res);
            });
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
Copyright (c) 2016-2017 Ice Services

[![@moleculerjs](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
