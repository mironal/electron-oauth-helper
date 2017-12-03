# Electron OAuth Helper

[![Greenkeeper badge](https://badges.greenkeeper.io/mironal/electron-oauth-helper.svg)](https://greenkeeper.io/)

[![NPM](https://nodei.co/npm/electron-oauth-helper.png)](https://nodei.co/npm/electron-oauth-helper/)

[![Build Status](https://travis-ci.org/mironal/electron-oauth-helper.svg)](https://travis-ci.org/mironal/electron-oauth-helper)

## What's this

Easy to use helper library for OAuth1 and OAuth2.

This automatically manages the Electron window for OAuth.

You can get a token just by calling a method of start OAuth.

This library is lightweight because it depends only on [debug](https://github.com/visionmedia/debug) module.

## Install

`npm install electron-oauth-helper --save`

## Usage

### OAuth1

```js

const { OAuth1Provider } = require("electron-oauth-helper")

const config = { /* oauth config. please see example/main/config.example.js.  */}
const provider = new OAuth1Provider(config)
provider.perform()
  .then(resp => {
    console.log(resp)
  })
  .catch(error => console.error(error))
```

### OAuth2

```js

const { OAuth2Provider } = require("electron-oauth-helper")

const config = { /* oauth config. please see example/main/config.example.js.  */}
const provider = new OAuth2Provider(config)
provider.perform()
  .then(resp => {
    console.log(resp)
  })
  .catch(error => console.error(error))
```

### Firebase Auth Integration

Electron can not use firebase auth `signInWithPopup` or `signInWithRedirect`.
You can only use email/password authentication.

But, you can use GitHub, Twitter, etc... authentication by using manually flow.

https://firebase.google.com/docs/auth/web/github-auth#handle_the_sign-in_flow_manually


```js

// Github manually flow example.

const { OAuth2Provider } = require("electron-oauth-helper")

const config = { /* oauth config. please see example/main/config.example.js.  */}
const provider = new OAuth2Provider(config)
provider.perform()
  .then(resp => {
    const query = querystring.parse(resp)
    const credential = firebase.auth.GithubAuthProvider.credential(query.access_token)
    firebase.auth().signInWithCredential(credential)
    .then(user => {
        console.log(user)
    })
    .catch(error => console.error(error))
  })
  .catch(error => console.error(error))
```

> Don't forget setting firebase auth.

## Example

example electron app => `example/`

![example screenshot](./ss/example.png)