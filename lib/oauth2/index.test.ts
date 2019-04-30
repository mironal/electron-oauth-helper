// import anyTest, { TestInterface } from "ava"
// import { OAuth2Provider } from "."
// import {
//   KoaExecutionContext,
//   routing,
//   startServer,
//   stopServer,
// } from "../__test_utils"
// import { BrowserWindow } from "electron"
// import { EOHError } from "../.."
// import { Application } from "spectron"
//
// const test = anyTest as TestInterface<KoaExecutionContext>
//
// test.beforeEach(async t => {
//   await startServer(t)
// })
//
// test.afterEach.always(async t => {
//   await stopServer(t)
// })
//
// test("Authorization Code Grant: An error is thrown if config is empty", t => {
//   t.throws(() => {
//     new OAuth2Provider({})
//   })
// })
//
// test("Authrorization Code Grant: An error is thrown if config is incomplete", t => {
//   t.throws(() => {
//     new OAuth2Provider({
//       authorize_url: "a",
//     })
//   })
//
//   t.throws(() => {
//     new OAuth2Provider({
//       response_type: "code",
//       authorize_url: "a",
//     })
//   })
//
//   t.throws(() => {
//     new OAuth2Provider({
//       response_type: "code",
//       authorize_url: "a",
//       access_token_url: "b",
//     })
//   })
//
//   t.throws(() => {
//     new OAuth2Provider({
//       response_type: "code",
//       authorize_url: "a",
//       access_token_url: "b",
//     })
//   })
//
//   t.throws(() => {
//     new OAuth2Provider({
//       response_type: "code",
//       authorize_url: "a",
//       access_token_url: "b",
//       client_id: "d",
//     })
//   })
// })
//
// test("Authrorization Code Gran: An instance can be created", t => {
//   t.truthy(
//     new OAuth2Provider({
//       response_type: "code",
//       authorize_url: "a",
//       access_token_url: "b",
//       client_id: "d",
//       redirect_uri: "f",
//     }),
//   )
//
//   t.truthy(
//     new OAuth2Provider({
//       authorize_url: "a",
//       access_token_url: "b",
//       client_id: "d",
//       redirect_uri: "f",
//     }),
//     "default response_type is code",
//   )
// })
//
// test("Authorization Code Grant: request success", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "code",
//       })
//       const redirectURL = `${ctx.query.redirect_uri}?code=abcd`
//       ctx.redirect(redirectURL)
//     })
//
//     router.post("/token", ctx => {
//       t.deepEqual(ctx.request.body, {
//         grant_type: "authorization_code",
//         code: "abcd",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         client_id: "client id",
//       })
//
//       ctx.body = {
//         access_token: "token",
//         token_type: "example",
//         expires_in: 3600,
//         refresh_token: "refresh",
//       }
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     access_token_url: `http://localhost:${port}/token`,
//     response_type: "code",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//   const resp = await provider.perform(window)
//   t.deepEqual(
//     {
//       access_token: "token",
//       token_type: "example",
//       expires_in: 3600,
//       refresh_token: "refresh",
//     },
//     resp,
//   )
// })
//
// test("Authorization Code Grant: request success with custom parameter", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "code",
//         custom_auth: "custom auth param",
//       })
//       const redirectURL = `${ctx.query.redirect_uri}?code=abcd`
//       ctx.redirect(redirectURL)
//     })
//
//     router.post("/token", ctx => {
//       t.deepEqual(ctx.request.body, {
//         grant_type: "authorization_code",
//         custom_token: "custom token param",
//         code: "abcd",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         client_id: "client id",
//       })
//
//       ctx.body = {
//         access_token: "token",
//         token_type: "example",
//         expires_in: 3600,
//         refresh_token: "refresh",
//       }
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     access_token_url: `http://localhost:${port}/token`,
//     response_type: "code",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   provider.on("before-authorize-request", query => {
//     query["custom_auth"] = "custom auth param"
//   })
//   provider.on("before-access-token-request", parameter => {
//     parameter["custom_token"] = "custom token param"
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//   const resp = await provider.perform(window)
//   t.deepEqual(
//     {
//       access_token: "token",
//       token_type: "example",
//       expires_in: 3600,
//       refresh_token: "refresh",
//     },
//     resp,
//   )
// })
//
// test("Authorization Code Grant: authorize request failure", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "code",
//       })
//       const redirectURL = `${ctx.query.redirect_uri}?error=access_denied`
//       ctx.redirect(redirectURL)
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     access_token_url: `http://localhost:${port}/token`,
//     response_type: "code",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//
//   const resp = await t.throwsAsync(provider.perform(window), {
//     instanceOf: EOHError,
//     message: "error response",
//   })
//
//   /*j
//   t.deepEqual(
//     {
//       error: "access_denied",
//     },
//     resp.query,
//   )
//   */
// })
//
// test("Authorization Code Grant: token request failure", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "code",
//       })
//       const redirectURL = `${ctx.query.redirect_uri}?code=abcd`
//       ctx.redirect(redirectURL)
//     })
//
//     router.post("/token", ctx => {
//       t.deepEqual(ctx.request.body, {
//         grant_type: "authorization_code",
//         code: "abcd",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         client_id: "client id",
//       })
//
//       ctx.status = 400
//       ctx.body = {
//         error: "invalid_request",
//       }
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     access_token_url: `http://localhost:${port}/token`,
//     response_type: "code",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//
//   const error = await t.throwsAsync(provider.perform(window))
//   t.is(error.message, "Error response: 400 - Bad Request")
//   // t.deepEqual(JSON.parse(error.response.body), { error: "invalid_request" })
// })
//
// test("Implicit Grant: request success", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "token",
//       })
//       const redirectURL = `${
//         ctx.query.redirect_uri
//       }#access_token=abcd&token_type=bearer`
//       ctx.redirect(redirectURL)
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     response_type: "token",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//   const resp = await provider.perform(window)
//   t.deepEqual(
//     {
//       access_token: "abcd",
//       token_type: "bearer",
//     },
//     resp,
//   )
// })
//
// test("Implicit Grant: request success with custom parameter", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "token",
//         hoge: "⁽⁽◝( ˙ ꒳ ˙ )◜⁾⁾",
//       })
//       const redirectURL = `${
//         ctx.query.redirect_uri
//       }#access_token=abcd&token_type=bearer`
//       ctx.redirect(redirectURL)
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     response_type: "token",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   provider.on("before-authorize-request", query => {
//     query["hoge"] = "⁽⁽◝( ˙ ꒳ ˙ )◜⁾⁾"
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//   const resp = await provider.perform(window)
//   t.deepEqual(
//     {
//       access_token: "abcd",
//       token_type: "bearer",
//     },
//     resp,
//   )
// })
//
// test("Implicit Grant: request failure", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.get("/authorize", ctx => {
//       t.deepEqual(ctx.query, {
//         client_id: "client id",
//         redirect_uri: `http://localhost:${port}/redirect`,
//         response_type: "token",
//       })
//       const redirectURL = `${ctx.query.redirect_uri}#error=access_denied`
//       ctx.redirect(redirectURL)
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     authorize_url: `http://localhost:${port}/authorize`,
//     response_type: "token",
//     client_id: "client id",
//     redirect_uri: `http://localhost:${port}/redirect`,
//   })
//
//   const window = new BrowserWindow({
//     width: 600,
//     height: 600,
//     show: false,
//   })
//
//   const resp = await t.throwsAsync(provider.perform(window), {
//     instanceOf: EOHError,
//   })
//   /*
//   t.deepEqual(
//     {
//       error: "access_denied",
//     },
//     resp,
//   )
//   */
// })
//
// test("Resource Owner Password Credentials Grant", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.post("/token", ctx => {
//       t.deepEqual(ctx.request.body, {
//         grant_type: "password",
//         scope: "scope",
//         username: "user",
//         password: "pass",
//       })
//
//       ctx.body = {
//         access_token: "access token",
//         token_type: "bearer",
//       }
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     access_token_url: `http://localhost:${port}/token`,
//     grant_type: "password",
//     scope: "scope",
//     username: "user",
//     password: "pass",
//   })
//
//   const resp = await provider.perform()
//
//   t.deepEqual(
//     {
//       access_token: "access token",
//       token_type: "bearer",
//     },
//     resp,
//   )
// })
//
// test("Client Credentials Grant", async t => {
//   const { koa, port } = t.context
//
//   routing(koa)(router => {
//     router.post("/token", ctx => {
//       t.deepEqual(ctx.request.body, {
//         grant_type: "client_credentials",
//         scope: "scope",
//       })
//
//       ctx.body = {
//         access_token: "access token",
//         token_type: "bearer",
//       }
//     })
//   })
//
//   const provider = new OAuth2Provider({
//     access_token_url: `http://localhost:${port}/token`,
//     grant_type: "client_credentials",
//     scope: "scope",
//   })
//
//   const resp = await provider.perform()
//
//   t.deepEqual(
//     {
//       access_token: "access token",
//       token_type: "bearer",
//     },
//     resp,
//   )
// })
//
