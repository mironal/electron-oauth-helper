const test = require("ava")
const { BrowserWindow } = require("electron")
const querystring = require("querystring")

const {
  routing,
  startServer,
  stopServer,
} = require("../__test_utils")

const OAuth1Provider = require("./")

test.beforeEach(async t => {
  await startServer(t)
})

test.afterEach.always(async t => {
  await stopServer(t)
})

test("Success", async t => {

  const { koa, port } = t.context

  routing(koa)(router => {

    router.post("/oauth/request", ctx => {

      t.true(ctx.headers["authorization"].startsWith("OAuth oauth_callback="))

      ctx.body = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_token_secret: "oauth secret1",
        oauth_callback_confirmed: true,
      })
    })

    router.get("/oauth/authorize", ctx => {
      t.deepEqual(ctx.query, {
        oauth_token: "oauth token1",
      })

      const query = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_verifier: "oauth verifier",
      })

      const redirectUrl = `http://localhost:${port}/callback?${query}`
      ctx.redirect(redirectUrl, 303)
    })

    router.post("/oauth/access", ctx => {
      t.deepEqual(ctx.request.body, {
        oauth_verifier: "oauth verifier",
      })

      ctx.body = querystring.stringify({
        oauth_token: "oauth token2",
        oauth_token_secret: "oauth secret2",
      })
    })

    router.get("/callback", ctx => {
      ctx.body = "hello"
    })
  })

  const provider = new OAuth1Provider({
    oauth_consumer_key: "consumer key",
    oauth_consumer_secret: "consumer secret",
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    callback_url: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  const resp = await provider.perform(window)
  t.deepEqual(resp, {
    oauth_token: "oauth token2",
    oauth_token_secret: "oauth secret2"
  })
})

test("Request Token failed", async t => {

  const { koa, port } = t.context

  routing(koa)(router => {

    router.post("/oauth/request", ctx => {
      ctx.status = 400
      ctx.body = "error message"
    })
  })

  const provider = new OAuth1Provider({
    oauth_consumer_key: "consumer key",
    oauth_consumer_secret: "consumer secret",
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    callback_url: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  const error = await t.throws(provider.perform(window))
  t.is(error.message, "Error response: 400 - Bad Request")
  t.is(error.response.body, "error message")
})

test("Authorization failed", async t => {

  const { koa, port } = t.context

  routing(koa)(router => {

    router.post("/oauth/request", ctx => {

      t.true(ctx.headers["authorization"].startsWith("OAuth oauth_callback="))

      ctx.body = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_token_secret: "oauth secret1",
        oauth_callback_confirmed: true,
      })
    })

    router.get("/oauth/authorize", ctx => {
      t.deepEqual(ctx.query, {
        oauth_token: "oauth token1",
      })

      const query = querystring.stringify({
        oauth_token: "denied",
      })

      const redirectUrl = `http://localhost:${port}/callback?${query}`
      ctx.redirect(redirectUrl, 303)
    })
  })

  const provider = new OAuth1Provider({
    oauth_consumer_key: "consumer key",
    oauth_consumer_secret: "consumer secret",
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    callback_url: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  const error = await t.throws(provider.perform(window))
  t.is(error.message, "User denied or invalid response")
})

test("Access Token failed", async t => {

  const { koa, port } = t.context

  routing(koa)(router => {

    router.post("/oauth/request", ctx => {

      t.true(ctx.headers["authorization"].startsWith("OAuth oauth_callback="))

      ctx.body = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_token_secret: "oauth secret1",
        oauth_callback_confirmed: true,
      })
    })

    router.get("/oauth/authorize", ctx => {
      t.deepEqual(ctx.query, {
        oauth_token: "oauth token1",
      })

      const query = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_verifier: "oauth verifier",
      })

      const redirectUrl = `http://localhost:${port}/callback?${query}`
      ctx.redirect(redirectUrl, 303)
    })

    router.post("/oauth/access", ctx => {
      t.deepEqual(ctx.request.body, {
        oauth_verifier: "oauth verifier",
      })

      ctx.status = 400
    })

    router.get("/callback", ctx => {
      ctx.body = "hello"
    })
  })

  const provider = new OAuth1Provider({
    oauth_consumer_key: "consumer key",
    oauth_consumer_secret: "consumer secret",
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    callback_url: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  const error = await t.throws(provider.perform(window))
  t.is(error.message, "Error response: 400 - Bad Request")
})
