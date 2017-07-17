<a name="0.4.0"></a>
# 0.4.0 (2017-07-17)

## New
### Encoding & decoding IDs
There are two new `encodeID` and `decodeID` methods. You can use them if you want to encode & decode database ID (for example with [hashids](https://github.com/ivanakimov/hashids.js))
```js
const Hashids = require("hashids");
const hashids = new Hashids("secret salt");

broker.createService({
    name: "posts",
    mixins: [DbService],
    methods: {
        encodeID(id) {
            return hashids.encodeHex(id);
        },
        decodeID(id) {
            return hashids.decodeHex(id);
        }
    }
});
```

### Entity lifecycle events
There are 3 entity lifecycle events which are called when entities are manipulated.

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

### Better fields filtering
A new fields filtering method is implemented. It can also handle nested properties.
```js
const DbService = require("moleculer-db");

module.exports = {
    name: "users",
    mixins: [DbService],

    settings: {
        fields: ["name", "address.city", "address.country", "bio"]
    }
}

broker.call("users.get", { id: 5, fields: ["name", "address", "bio.height", "bio.hair", "password"] }).then(console.log);
/* The returned object contains only the following fields:
{
    name: "Walter",
    address: {
        city: "Albuquerque",
        country: "USA"
    },
    bio: {
        height: 185,
        hair: "bald"
    }
}
*/
```
## Changes
- deprecated `fields` as space-separated `String` in `settings`. Enabled only `Array<String>`.
- deprecated `fields` as space-separated `String` in `fields` of `settings.populates`. Enabled only `Array<String>`.

- **BREAKING**: `model` action & method is removed! Use `get` action instead.

- `moleculer-db-adapter-mongoose` returns with Mongoose objects instead of native object. But it will be converted to native JS object in [moleculer-db].
    ```js
        customAction(ctx) {
            return this.adapter.find({}).then(docs => {
                // You can access the Mongoose virtual methods & getters of `docs` here
            });
        }        
    ```

--------------------------------------------------
<a name="0.3.0"></a>
# 0.3.0 (2017-07-07)

## New

### New `createMany` method
A new `createMany` method is created. With it you can insert many entities to the database.

```js
this.createMany(ctx, {
    entities: [...]
});
```

### New `list` action with pagination
There is a new `list` action with pagination support.

```js
broker.call("posts.list", { page: 2, pageSize: 10});
```
The result is similar as 
```js
{ 
    rows: [ 
        { title: 'Post #26' },
        { title: 'Post #27' },
        { title: 'Post #25' },
        { title: 'Post #21' },
        { title: 'Post #28' } 
    ],
    total: 28,
    page: 2,
    pageSize: 10,
    totalPages: 3 
}
```

### New settings
- `pageSize` - Default page size in `list` action. Default: `10`
- `maxPageSize` - Maximum page size in `list` action. Default: `100`
- `maxLimit` - Maximum value of limit in `find` action. Default: `-1` (no limit)

--------------------------------------------------
<a name="0.2.0"></a>
# 0.2.0 (2017-07-06)

## Breaking changes

### Renamed service methods
- `findAll` renamed to `find`
- `update` renamed to `updateMany`
- `remove` renamed to `removeMany`

### `clear` action is removed
We removed the `clear` action from service The reason is if you don't filter it in whitelists of API gw, it will be published and callable from client-side what is very dangerous.

After all if you need it:
```js
module.exports = {
    name: "posts",
    mixins: [DbService],

    actions: {
        clear(ctx) {
            return this.clear(ctx);
        }
    }
}
```

### Renamed adapter methods
- `findAll` renamed to `find`
- `update` renamed to `updateMany`
- `remove` renamed to `removeMany`

--------------------------------------------------
