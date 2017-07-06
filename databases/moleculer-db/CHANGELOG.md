<a name="0.2.0"></a>
# 0.2.0 (2017-07-06)

# Breaking changes

## Renamed service methods
- `findAll` renamed to `find`
- `update` renamed to `updateMany`
- `remove` renamed to `removeMany`

## `clear` action is removed
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

## Renamed adapter methods
- `findAll` renamed to `find`
- `update` renamed to `updateMany`
- `remove` renamed to `removeMany`

--------------------------------------------------