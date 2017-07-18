![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-db [![NPM version](https://img.shields.io/npm/v/moleculer-db.svg)](https://www.npmjs.com/package/moleculer-db)

Service mixin to store entities in database.

## Features
- default CRUD actions
- cached queries
- pagination support
- pluggable adapter (default memory adapter with [NeDB](https://github.com/louischatriot/nedb) for testing & prototyping)
- fields filtering
- populating
- encode/decod IDs
- entity lifecycle events for notifications

## Install

```bash
$ npm install moleculer-db --save
```
or
```bash
$ yarn add moleculer-db
```

## Usage

```js
"use strict";

const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");

const broker = new ServiceBroker();

// Create a DB service for `user` entities
broker.createService({
    name: "users",
    mixins: [DbService],

    settings: {
        fields: ["_id", "username", "name"]
    },

    afterConnected() {
        // Seed the DB with ˙this.create`
    }
});

broker.start()
// Create a new user
.then(() => broker.call("users.create", { entity: {
    username: "john",
    name: "John Doe",
    status: 1
}}))

// Get all users
.then(() => broker.call("users.find").then(console.log));

```

## Settings
| Property | Type | Description |
| -------- | ---- | ----------- |
| `idField` | `String` | Name of ID field. Default: `_id` |
| `fields` | `Array` | Field list for filtering. It is an `Array`. If the value is `null` or `undefined` doesn't filter the fields. |
| `populates` | `Object` | Schema for population. [Read more](#populating) |
| `pageSize` | `Number` | Default page size in `list` action. Default: `10` |
| `maxPageSize` | `Number` | Maximum page size in `list` action. Default: `100` |
| `maxLimit` | `Number` | Maximum value of limit in `find` action. Default: `-1` (no limit) |


## Actions
| Name | Params | Result | Description |
| ---- | ------ | ------ | ----------- |
| `find` | `limit`, `offset`, `sort`, `search`, `searchFields`, `fields`, `populate`, `query` | `Array` | Find matched entities. |
| `list` | `page`, `pageSize`, `sort`, `search`, `searchFields`, `fields`, `populate`, `query` | `Object` | List paginated entities. The result contains `rows`, `total` and `totalPages` properties. |
| `count` | `search`, `searchFields` | `Number` | Count of  matched entities. |
| `create` | `entity` | `Object` | Create a new entity. |
| `get` | `id`, `populate`, `fields`, `mapping` | `Object|Array` | Get an entity or entities by ID/IDs. |
| `update` | `id`, `update` | `Object` | Update an entity by ID. |
| `remove` | `id` | `` | Remove an entity by ID. |

## Methods

### `this.find(ctx, params)`
Find entities by filters. The `params` will be passed to the adapter.

### `this.count(ctx, params)`
Get count of find entities by filters. The `params` will be passed to the adapter.

### `this.create(ctx, params)`
Create a new entity. The `params.entity` will be passed to the adapter.

### `this.createMany(ctx, params)`
Create many new entities. The `params.entities` will be passed to the adapter.

### `this.get(ctx, params)`
Get an entity or entities by ID/IDs.

### `this.updateById(ctx, params)`
Update entity by ID. The `params.id` & `params.update` will be passed to the adapter.

> After operation the cache will be cleared!

### `this.updateMany(ctx, params)`
Update multiple entities by query. The `params.query` & `params.update` will be passed to the adapter.

> After operation the cache will be cleared!

### `this.removeById(ctx, params)`
Remove entity by ID. The `params.id` will be passed to the adapter.

> After operation the cache will be cleared!

### `this.removeMany(ctx, params)`
Remove multiple entitites by query. The `params.query` will be passed to the adapter.

> After operation the cache will be cleared!

### `this.clear()`
Delete all entitites. 

> After operation the cache will be cleared!

### `this.clearCache()`
Clear cached entitites. 

### `this.encodeID()`
Encode ID of entity

### `this.decodeID()`
Decode ID of entity 


## Populating
The service supports to populate fields from other services. 
E.g.: if you have an `author` field in `post` entity, you can populate it with `users` service by ID of author. If the field is an `Array` of IDs, it will populate all entities via only one request.

**Example of populate schema**
```js
broker.createService({
    name: "posts",
    mixins: [DbService],
    settings: {
        populates: {
            // Shorthand populate rule. Resolve the `voters` values with `users.get` action.
            "voters": "users.get",

            // Define the params of action call. It will receive only with username & full name of author.
            "author": {
                action: "users.get",
                params: {
                    fields: "username fullName"
                }
            },

            // Custom populator handler function
            "rate"(ids, rule, ctx) {
                return Promise.resolve(...);
            }
        }
    }
});

// List posts with populated authors
broker.call("posts.find", { populate: ["author"]}).then(console.log);
```

> The `populate` parameter is available in `find`, `list` and `get` actions.

## Lifecycle entity events
There are 3 lifecycle entity events which are called when entities are manipulated.

```js
broker.createService({
    name: "posts",
    mixins: [DbService],
    settings: {},

	afterConnected() {
		this.logger.info("Connected successfully");
	},

	entityCreated(json, ctx) {
		this.logger.info("New entity created!");
	},

	entityUpdated(json, ctx) {
        // You can also access to Context
		this.logger.info(`Entity updated by '${ctx.meta.user.name}' user!`);
	},

	entityRemoved(json, ctx) {
		this.logger.info("Entity removed", json);
	},    
});
```

> Please note! If you manipulate multiple entities, the `json` parameter will be `null` (currently)!

## Extend with custom actions
Naturally you can extend this service with your custom actions.
In this case we recommend to use only built-in methods to access or manipulate entities. 

> In the worst case you can call directly the adapter as `this.adapter.findById`.

```js
const DbService = require("moleculer-db");

module.exports = {
    name: "posts",
    mixins: [DbService],

    settings: {
        fields: ["_id", "title", "content", "votes"]
    },

    actions: {
        // Increment `votes` field by post ID
        vote(ctx) {
            return this.updateById(ctx, { id: ctx.params.id, update: { $inc: { votes: 1 } }}));
        },

        // List posts of an author
        byAuthors(ctx) {
            return this.find(ctx, {
                query: {
                    author: ctx.params.authorID
                },
                limit: ctx.params.limit || 10,
                sort: "-createdAt"
            })
        }
    }
}
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

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
