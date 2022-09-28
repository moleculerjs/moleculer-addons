![Moleculer logo](http://moleculer.services/images/banner.png)

Job queue mixin for [graphile-worker](https://github.com/graphile/worker).

# Install

```
$ npm install moleculer-pqsl-queue
```

# Configuration

1. Start your PostgreSQL db.

2. Create an empty db `psql -U postgres -c 'CREATE DATABASE task_queue'`.

    > Replace `task_queue` with your db name

3. Use [graphile-worker](https://github.com/graphile/worker#running) CLI to init the schema for the jobs `npx graphile-worker -c \"postgres://postgres:postgres@localhost:5444/task_queue\" --schema-only`.

    > Set your connection URL (more info: check [docs](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)) and replace `task_queue` with db name that you've defined in `step 2)`

# Usage

## Create queue worker service

```js
const PsqlQueueService = require("moleculer-pqsl-queue");

broker.createService({
    name: "task-worker",

    mixins: [
        PsqlQueueService(
            "postgres://postgres:postgres@localhost:5444/task_queue"
            // {}, // Optional worker options. More info: https://github.com/graphile/worker#runneroptions
            // {}, // Optional producer options: More info: https://github.com/graphile/worker#workerutilsoptions
        ),
    ],

    queues: {
        /**
         * @param {Object} payload Message payload
         * @param {import('graphile-worker').JobHelpers} helpers Postgres helpers
         * More info about helpers: https://github.com/graphile/worker#creating-task-executors
         */
        "sample.task"(payload, helpers) {
            // if (Math.random() > 0.5) {
            this.logger.info('New "simple.task" received!', payload);
            return;
            // } else {
            //	throw new Error('Random "sample.task" error');
            // }
        },

        "another.task": {
            /**
             * @param {Object} payload Message payload
             * @param {import('graphile-worker').JobHelpers} helpers Postgres helpers
             * More info about helpers: https://github.com/graphile/worker#creating-task-executors
             */
            process(payload, helpers) {
                this.logger.info('New "another.task" job received!', payload);
            },
        },
    },
});
```

## Customize worker logger

```js
const PsqlQueueService = require("moleculer-pqsl-queue");

broker.createService({
    name: "task-worker",

    mixins: [
        PsqlQueueService(
            "postgres://postgres:postgres@localhost:5444/task_queue"
        ),
    ],

    methods: {
        /**
         * Replaces Default logger with custom one.
         * By default uses Moleculer logger instance
         * More info: https://github.com/graphile/worker#logger
         */
        initLogger() {
            /**
             * @param {String} level Log level
             * @param {String} message Message to log
             * @param {Object} meta  Additional metadata
             */
            return (level, message, meta) => {
                this.loggerQueue[level](message);
            };
        },
    },

    // Add Workers here
    queues: {},
});
```

## Listen to queue events

```js
const PsqlQueueService = require("moleculer-pqsl-queue");

broker.createService({
    name: "task-worker",

    mixins: [
        PsqlQueueService(
            "postgres://postgres:postgres@localhost:5444/task_queue"
        ),
    ],

    settings: {
        /**
         * @type {Record<String, Function>}
         * For a complete list of events see: https://github.com/graphile/worker#workerevents
         */
        jobEventHandlers: {
            /**
             * @param {{
             *  worker: import('graphile-worker').Worker,
             *  job: import('graphile-worker').Job
             * }}
             * @this {import('moleculer').Service}
             */
            "job:success": function ({ worker, job }) {
                this.logger.info(
                    `Worker ${worker.workerId} completed job ${job.id}`
                );
            },
        },
    },

    // Add Workers here
    queues: {},
});
```

## Create Task

```js
const PsqlQueueService = require("moleculer-pqsl-queue");

broker.createService({
    name: "pub",

    mixins: [
        PsqlQueueService(
            "postgres://postgres:postgres@localhost:5444/task_queue"
        ),
    ],

    /**
     * Service started lifecycle event handler
     * @this {import('moleculer').Service}
     */
    async started() {
        try {
            /**
             * @param {String} name Task name
             * @param {Object} payload Payload to pass to the task
             * @param {import('graphile-worker').TaskSpec?} opts
             */
            await this.createJob("sample.task", {
                id: 1,
                name: "simple.task",
            });
        } catch (error) {
            this.logger.error('Error creating "sample.task" job', error);
        }
    },
});
```

## Advanced Usage

The graphile-worker lib provides some advanced features like [administration functions](https://github.com/graphile/worker#administration-functions). These functions can be used to manage the queue and can be accessed via the `this.$producer` property of the service.

```js
const PsqlQueueService = require("moleculer-pqsl-queue");

broker.createService({
    name: "pub",

    mixins: [
        PsqlQueueService(
            "postgres://postgres:postgres@localhost:5444/task_queue"
        ),
    ],

    /**
     * Service started lifecycle event handler
     * @this {import('moleculer').Service}
     */
    async started() {
        // Add the job via raw graphile-worker client
        // For more info check the docs: https://github.com/graphile/worker#administration-functions
        this.$producer.addJob("sample.task", {
            id: 1,
            name: "simple.task",
        });
    },
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

Copyright (c) 2016-2022 MoleculerJS

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
