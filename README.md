# I haven't used electron recently, so this repository is not currently maintained.If a pull request comes in, it could be reviewed and merged.

# Electron OAuth Helper

[![NPM](https://nodei.co/npm/electron-oauth-helper.png)](https://nodei.co/npm/electron-oauth-helper/)

[![Build Status](https://travis-ci.org/mironal/electron-oauth-helper.svg)](https://travis-ci.org/mironal/electron-oauth-helper)

Tested by Electron 4.2.0.

## What's this

Easy to use helper library for OAuth1 and OAuth2.

All grant type supported.

- Authorization Code Grant
- Implicit Grant
- Resource Owner Password Credentials Grant
- Client Credentials Grant

> TODO: Refreshing an Access Token

You can get a token just by calling a method of start OAuth.

This library is lightweight because it depends only on [debug](https://github.com/visionmedia/debug) module.

## Install

`npm install electron-oauth-helper --save`

## Usage

### OAuth1

```js

import OAuth1Provider from "electron-oauth-helper/oauth1"

const window = new BrowserWindow({
  width: 600,
  height: 800,
  webPreferences: {
    nodeIntegration: false // We recommend disabling nodeIntegration for security.
    contextIsolation: true // We recommend enabling contextIsolation for security.
    // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
  },
})

const config = { /* oauth config. please see example/main/config.example.js.  */}
const provider = new OAuth1Provider(config)
provider.perform(window)
  .then(resp => {
    console.log(resp)
  })
  .catch(error => console.error(error))
```

### OAuth2

```js

import OAuth2Provider from "electron-oauth-helper/oauth2"

const window = new BrowserWindow({
  width: 600,
  height: 800,
  webPreferences: {
    nodeIntegration: false // We recommend disabling nodeIntegration for security.
    contextIsolation: true // We recommend enabling contextIsolation for security.
    // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
  },
})

const config = { /* oauth config. please see example/main/config.example.js.  */}
const provider = new OAuth2Provider(config)
// Your can use custom parameter.
provider.on("before-authorize-request", parameter => {
    parameter["XXXX-Hoge"] = "hogehoge"
})

provider.on("before-access-token-request", (parameter, headers) => {
    parameter["XXXX-Hoge"] = "hogehoge"
    headers["Huga"] = "hugahgua"
})

provider.perform(window)
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
provider.perform(window)
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

---

# Which parameters are required?

## [OAuth 2](https://tools.ietf.org/html/rfc6749)

The OAuth2 defines four grant type. Here is sample code for each.

1. Authorization Code Grant
2. Implicit Grant
3. Resource Owner Password Credentials Grant
4. Client Credentials Grant

### Authorization Code Grant

> [RFC 6749: 4.1](https://tools.ietf.org/html/rfc6749#section-4.1)

```js
const provider = new OAuth2Provider({
  authorize_url: "",
  access_token_url: "",
  response_type: "code",
  client_id: "",
  redirect_uri: "", //Important! RFC says OPTIONAL. But REQUIRED for this library.
  // other parameters are optional.
})

provider.perform()
// Authorization Request --->
//                       <--- Authorization Response
// Access Token Request  --->
//                       <--- Access Token Response
.then(resp => {
  // Got Access Token (◍•ᴗ•◍)
})
```

#### Authorization Request

`GET /authorize?...`

```js
// more detail
{
  // REQUIRED. Value MUST be set to "code".
  response_type: "code",

  // REQUIRED. The client identifier as described in Section 2.2.
  client_id: "",

  // OPTIONAL. As described in Section 3.1.2.
  redirect_uri: "",

  // OPTIONAL. The scope of the access request as described by Section 3.3.
  scope: "",

  // RECOMMENDED.  An opaque value used by the client to maintain
  // state between the request and callback.  The authorization
  // server includes this value when redirecting the user-agent back
  // to the client.  The parameter SHOULD be used for preventing
  // cross-site request forgery as described in Section 10.12.
  state: "",

  // Additional.
  // the `code_challenge` and `code_challenge` are optional parameters
  // defined in RFC 7636.

  // REQUIRED.  Code challenge.
  code_challenge: "",

  // OPTIONAL, defaults to "plain" if not present in the request.  Code
  // verifier transformation method is "S256" or "plain".
  code_challege_method: "",
}
```
#### Authorization Response

```js
{
  // REQUIRED.  The authorization code generated by the
  // authorization server.
  code: "",

  // REQUIRED if the "state" parameter was present in the client
  // authorization request.  The exact value received from the
  // client.
  state: "",
}
```

> [Error Response](https://tools.ietf.org/html/rfc6749#section-4.1.2.1)

#### Access Token Request

`POST /token`

```js
{
  // REQUIRED.  Value MUST be set to "authorization_code".
  grant_type: "authorization_code",

  // REQUIRED.  The authorization code received from the
  // authorization server.
  code: "",

  // REQUIRED, if the "redirect_uri" parameter was included in the
  // authorization request as described in Section 4.1.1, and their
  // values MUST be identical.
  redirect_uri: "",

  // REQUIRED, if the client is not authenticating with the
  // authorization server as described in Section 3.2.1.
  client_id: "",
}
```

#### Access Token Response

```js
{
  // REQUIRED.  The access token issued by the authorization server.
  access_token: "",

  // REQUIRED.  The type of the token issued as described in
  // Section 7.1.  Value is case insensitive.
  token_type: "",

  // RECOMMENDED.  The lifetime in seconds of the access token.  For
  // example, the value "3600" denotes that the access token will
  // expire in one hour from the time the response was generated.
  // If omitted, the authorization server SHOULD provide the
  // expiration time via other means or document the default value.
  expires_in: "",

  // OPTIONAL.  The refresh token, which can be used to obtain new
  // access tokens using the same authorization grant as described
  // in Section 6.
  refresh_token: "",

  // OPTIONAL, if identical to the scope requested by the client;
  // otherwise, REQUIRED.  The scope of the access token as
  // described by Section 3.3.
  scope: "",
}
```

[Error Response](https://tools.ietf.org/html/rfc6749#section-5.2)

### Implicit Grant

> [RFC 6749: 4.2](https://tools.ietf.org/html/rfc6749#section-4.2)

```js
const provider = new OAuth2Provider({
  authorize_url: "",
  response_type: "token",
  client_id: "",
  redirect_uri: "", //Important! RFC says OPTIONAL. But REQUIRED for this library.
  // other parameters are optional.
})

provider.perform()
// Authorization Request --->
//                       <--- Access Token Response
.then(resp => {
  // Got Access Token (◍•ᴗ•◍)
})
```

#### Authorization Request

`GET /authorize?...`

```js
{
  // REQUIRED. Value MUST be set to "token".
  response_type: "token",

  // REQUIRED. The client identifier as described in Section 2.2.
  client_id: "",
  // OPTIONAL.  As described in Section 3.1.2.
  redirect_uri: "",

  // OPTIONAL. The scope of the access request as described by
  // Section 3.3.
  scope: "",

  // RECOMMENDED.  An opaque value used by the client to maintain
  // state between the request and callback.  The authorization
  // server includes this value when redirecting the user-agent back
  // to the client.  The parameter SHOULD be used for preventing
  // cross-site request forgery as described in Section 10.12.
  state: "",
}
```

#### Access Token Response

> [Successful Response](https://tools.ietf.org/html/rfc6749#section-4.2.2)

> [Error Response](https://tools.ietf.org/html/rfc6749#section-4.2.2.1)

### Resource Owner Password Credentials Grant

> [RFC 6749: 4.3](https://tools.ietf.org/html/rfc6749#section-4.3)

```js
const provider = new OAuth2Provider({
  access_token_url: "",
  response_type: "password",
  username: "",
  password: "",
  // other parameters are optional.
})

provider.perform()
// Access Token Request --->
//                      <--- Access Token Response
.then( resp => {
  // Got Access Token (◍•ᴗ•◍)
})
```

#### Authorization Request and Response

No need.

#### Access Token Request

`POST /token`

```js
{
  // REQUIRED. Value MUST be set to "password".
  grant_type: "password",

  // REQUIRED. The resource owner username.
  username: "",

  // REQUIRED. The resource owner password.
  password: "",

  // OPTIONAL.  The scope of the access request as described by
  // Section 3.3.
  scope: "",
}
```

#### Access Token Response

> [Successful Response](https://tools.ietf.org/html/rfc6749#section-5.1)

> [Error Response](https://tools.ietf.org/html/rfc6749#section-5.2)

### Client Credentials Grant

> [RFC 6749: 4.4](https://tools.ietf.org/html/rfc6749#section-4.4)

```js
const provider = new OAuth2Provider({
  access_token_url: "",
  grant_type: "client_credentials",
  // other parameters are optional.
})

provider.perform()
// Access Token Request --->
//                      <--- Access Token Response
.then( resp => {
  // Got Access Token (◍•ᴗ•◍)
})

```
#### Authorization Request and Response

No need.

#### Access Token Request

`POST /token`

```js
{
  // REQUIRED. Value MUST be set to "client_credentials".
  grant_type: "client_credentials",

  // OPTIONAL. The scope of the access request as described by
  // Section 3.3.
  scope: "",
}
```

#### Access Token Response

> [Successful Response](https://tools.ietf.org/html/rfc6749#section-5.1)

> [Error Response](https://tools.ietf.org/html/rfc6749#section-5.2)


### Refreshing an Access Token

> [RFC 6749: 6](https://tools.ietf.org/html/rfc6749#section-6)

TODO

---


## How to release

1. `npm version patch | minor | major |...`
2. `npm publish`

