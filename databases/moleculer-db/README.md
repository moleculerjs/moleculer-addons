![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-db [![NPM version](https://img.shields.io/npm/v/moleculer-db.svg)](https://www.npmjs.com/package/moleculer-db)

Service mixin to store entities in database

## Features
- CRUD actions
- pluggable adapters
- cached queries
- default memory adapter with [NeDB](https://github.com/louischatriot/nedb) for testing & prototyping
- filtering properties in entity
- populate connections between services

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
    mixins: DbService,

    settings: {
        fields: "_id username name"
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
| Property | Description |
| -------- | ----------- |
| `idField` | Name of ID field. Default: `_id` |
| `fields` | Field list for filtering. It can be an `Array` or a space-separated `String`. If the value is `null` or `undefined` doesn't filter the fields. |
| `populates` | Populate schema |


## Actions
| Name | Params | Result | Description |
| ---- | ------ | ------ | ----------- |
| `find` | `limit`, `offset`, `sort`, `search`, `searchFields` | `Array` | Find matched entities. |
| `count` | `search`, `searchFields` | `Number` | Count of  matched entities. |
| `create` | `entity` | `Object` | Save a new entity. |
| `get` | `id` | `Object` | Get an entity by ID. |
| `model` | `id`, `populate`, `fields`, `resultAsObject` | `Object` | Get entities by ID/IDs. **For internal use only!** |
| `update` | `id`, `update` | `Object` | Update an entity by ID. |
| `remove` | `id` | `` | Remove an entity by ID. |
| `clear` | - | `` | Clear all entities. |

## Methods

### `this.find(ctx, params)`
Find entities by filters. The `params` will be passed to the adapter.

### `this.count(ctx, params)`
Get count of find entities by filters. The `params` will be passed to the adapter.

### `this.create(ctx, params)`
Create a new entity. The `params.entity` will be passed to the adapter.

### `this.get(ctx, params)`
Get an entities by ID. The `params.id` will be passed to the adapter.

### `this.model(ctx, params)`
Get entities by IDs. For internal use only!

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

## Populating

```js
broker.createService({
    name: "posts",
    mixins: DbService,
    settings: {
        populates: {
            // Shorthand populate rule. Resolve the `voters` values with `users.model` action.
            "voters": "users.model",

            // Define the params of action call. It will receive only with username & full name of author.
            "author": {
                action: "users.model",
                params: {
                    fields: "username fullName"
                }
            }
        }
    }
});
```

## Extend with custom actions

```js
const DbService = require("moleculer-db");

module.exports = {
	name: "posts",
    mixins: [DbService],

	settings: {
		fields: "_id title content votes"
	},

	actions: {
        // Increment `votes` field in a post entity
		vote(ctx) {
			return this.updateById(ctx, { id: ctx.params.id, update: { $inc: { votes: 1 } }}));
		},

        // List post of an author
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
