<a name="0.2.0"></a>

# [0.3.0]

-   Bump deps
-   Improve SIGINT and SIGTERM handling during shutdown

# [0.2.0]

-   Change mixin signature.
    **Old**

    ```js
    const PsqlQueueService = require("moleculer-psql-queue");
    broker.createService({
        name: "pub",
        mixins: [
            PsqlQueueService(
                "postgres://postgres:postgres@localhost:5444/task_queue"
                // {}, // Optional worker configs. More info: https://github.com/graphile/worker#runneroptions
                // {}, // Optional producer configs: More info: https://github.com/graphile/worker#workerutilsoptions
            ),
        ],
    });
    ```

    **New**

    ```js
    const PsqlQueueService = require("moleculer-psql-queue");
    broker.createService({
        name: "pub",
        mixins: [
            PsqlQueueService(
                "postgres://postgres:postgres@localhost:5444/task_queue",
                // Default opts
                {
                    // Name of the property in service schema.
                    schemaProperty: "queues",
                    // Name of the method in Service to create jobs
                    createJobMethodName: "createJob",
                    // Name of the property in Service to produce jobs
                    producerPropertyName: "$producer",
                    // Name of the property in Service to consume jobs
                    consumerPropertyName: "$consumer",
                    // Name of the internal queue that's used to store the job handlers
                    internalQueueName: "$queue",
                    // Name of the property in Service settings to register job event handlers
                    jobEventHandlersSettingsProperty: "jobEventHandlers",

                    // Optional producer configs: More info: https://github.com/graphile/worker#workerutilsoptions
                    producerOpts: {},
                    // Optional worker configs. More info: https://github.com/graphile/worker#runneroptions
                    queueOpts: {
                        concurrency: 5,
                        // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
                        noHandleSignals: false,
                        pollInterval: 1000,
                    },
                }
            ),
        ],
    });
    ```

-   Rename internal methods to avoid with other libs (e.g. `moleculer-bull`).

    -   `initLogger` -> `initWorkerLogger`
    -   `tryConnect` -> `tryConnectWorker`
    -   `connect` -> `connectWorker`

-   Bump deps
