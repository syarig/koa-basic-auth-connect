# koa-basic-auth-connect

[![Test](https://github.com/syarig/koa-basic-auth-connect/actions/workflows/test.yml/badge.svg)](https://github.com/syarig/koa-basic-auth-connect/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/koa-basic-auth-connect.svg)](https://badge.fury.io/js/koa-basic-auth-connect)
[![npm](https://img.shields.io/npm/dm/koa-basic-auth-connect.svg)]()
![TypeScript compatible](https://img.shields.io/badge/typescript-compatible-brightgreen.svg)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

## Installation

```shell
npm install koa-basic-auth-connect
```

## Example

```js
const Koa = require('koa');
const basicAuth = require('koa-basic-auth-connect');

const app = new Koa();

app.use(basicAuth({
  users: {'SampleUser': 'password'}
}));
```

The middleware checks for a match to the credentials of the received request. It parses the "Authorization" header
according to the Basic Authentication protocol and checks if the credentials are legitimate.

If it is correct, a property is added to `ctx.state.auth`. This object contains an object with `user` and `password`
properties

If authentication fails, a 401 HTTP response is returned.

## Options

```ts
export type FunctionalOption<T>=T | ((ctx: Context) => T);

type Options={
  users: Users;
  realm?: FunctionalOption<string>;
  challenge?: boolean;
  authorizer?: Authorizer;
  continueIfUnauthorized?: FunctionalOption<boolean>;
};
```

| Option    | Description                                                        | Default   |
|-----------|--------------------------------------------------------------------|-----------|
| users     | Records by User ID and Secret                                      |           |
| realm     | Set realm on unauthorized response                                 |  |
| challenge | Add a challenge header on unauthorized response | false     |
| authorizer          | Set custom authorizer function                                     |           |
|continueIfUnauthorized           | Continue middleware chain when unauthenticated                     | false     |

## Challenge

By default, the middleware does not add a `WWW-Authenticate` challenge header to the unauthorized response.

You can be enable that by `challenge` option. This will cause most browsers to display a popup for entering credentials
for unauthenticated responses. You may also add The realm can be used to identify the system to be authenticated and
stored by the client.

```js
app.use(basicAuth({
  users: {'ChallengeUser': 'psssword'},
  challenge: true,
  realm: 'Aiq+LNOl7X+LftH',
}))
```

## Authorizer

The user and password are passed to the callback (async) function.

For example, you can implement your own authentication like this

```js
app.use(basicAuth({
  authorizer: (user: string, password: string) => (password == 'anysecret')
}))
```
