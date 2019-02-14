<a name="2.0.0"></a>
# 2.0.0 (2019-02-18)

## Changes
- Update dependencies

## BREAKING CHANGES
- Most of the breaking changes come from `email-templates`

### Settings
- `from` fields was moved to `email-templates` config

```js
// Before
settings: {
	from: "something@example.com",
	transport: ...
}

// After
settings: {
	template: {
		message: {
			from: "something@example.com",
		}
	},
	transport: ...
}
```

- `transport` is still working but can also be pass directly to template configuration

```js
// Before (still working)
settings: {
	transport:  {
       service: 'gmail',
       auth: {
           user: 'gmail.user@gmail.com',
           pass: 'yourpass'
       }
   }
}

// Alternative way
settings: {
	template: {
		message: {
			from: "something@example.com",
		},
		transport:  {
          service: 'gmail',
          auth: {
              user: 'gmail.user@gmail.com',
              pass: 'yourpass'
          }
        }
	}
}
```

- `data` was renamed to `locals`

```js
// Before
settings: {
	transport: ...,
	data: {
		sitename: "My App"
	}
}

// After
settings: {
	transport: ...,
	locals: {
		sitename: "My App"
	}
}
```

- `templateFolder` was removed in favor of `email-templates` configuration

```js
// Before
settings: {
	templateFolder: "./templates",
    transport:  {
      service: 'gmail',
      auth: {
          user: 'gmail.user@gmail.com',
          pass: 'yourpass'
      }
	}
}

// After
settings: {
	template: {
		views: { root: "./templates" },
		transport:  {
          service: 'gmail',
          auth: {
              user: 'gmail.user@gmail.com',
              pass: 'yourpass'
          }
        }
	}
}
```

- `htmlToText` was removed in favor of `email-templates` configuration (activated by default)

### Send mail action

- You should still be able to send a `nodemailer` like object to the action
- For template mail, you have 2 things to change :
  - `data` become `locals`
  - `locale` moved to `locals.locale`
- You can also move all `nodemailer` fields to the `message` fields

--------------------------------------------------
<a name="1.2.0"></a>
# 1.2.0 (2018-03-28)

## Changes
- support `createTransport` method to create a nodemailer transport. Call at `created` if exists.

--------------------------------------------------
<a name="1.1.0"></a>
# 1.1.0 (2017-11-07)

## Changes
- add `data: {}` to `settings` for global template variables
- return with `MoleculerRetryableError` if unable to send mail.

--------------------------------------------------
