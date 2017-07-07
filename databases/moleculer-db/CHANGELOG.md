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
    totalPage: 3 
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
