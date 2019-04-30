import { routing, startServer, stopServer, TestServder } from "../__test_utils"
import querystring from "querystring"
import path from "path"
import { BrowserWindow } from "electron"
import { OAuth1Provider } from "."

let server: TestServder

beforeEach(async () => {
  server = await startServer()
})

afterEach(async () => {
  await stopServer(server)
})

it("Success", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.post("/oauth/request", ctx => {
      expect(ctx.headers["authorization"]).toEqual(
        expect.stringMatching(/^OAuth /),
      )

      ctx.body = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_token_secret: "oauth secret1",
        oauth_callback_confirmed: true,
      })
    })

    router.get("/oauth/authorize", ctx => {
      expect(ctx.query).toEqual({
        oauth_token: "oauth token1",
      })

      const query = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_verifier: "oauth verifier",
      })

      const redirectUrl = `http://localhost:${port}/callback?${query}`
      ctx.redirect(redirectUrl)
    })

    router.post("/oauth/access", ctx => {
      expect(ctx.request.body).toEqual({
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
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    oauth_callback: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    show: false,
  })

  const resp = await provider.perform(window)
  expect(resp).toEqual({
    oauth_token: "oauth token2",
    oauth_token_secret: "oauth secret2",
  })

  window.close()
}, 10000)

test("Request Token failed", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.post("/oauth/request", ctx => {
      ctx.status = 400
      ctx.body = "error message"
    })
  })

  const provider = new OAuth1Provider({
    oauth_consumer_key: "consumer key",
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    oauth_callback: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  await expect(provider.perform(window)).rejects.toThrowError(
    /400 - Bad Request : error message/,
  )
  window.close()
}, 10000)

test("Authorization failed", async () => {
  const { koa, port } = server
  routing(koa)(router => {
    router.post("/oauth/request", ctx => {
      expect(ctx.headers["authorization"]).toEqual(
        expect.stringMatching(/^OAuth /),
      )

      ctx.body = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_token_secret: "oauth secret1",
        oauth_callback_confirmed: true,
      })
    })

    router.get("/oauth/authorize", ctx => {
      expect(ctx.query).toEqual({
        oauth_token: "oauth token1",
      })

      const query = querystring.stringify({
        oauth_token: "denied",
      })

      const redirectUrl = `http://localhost:${port}/callback?${query}`
      ctx.redirect(redirectUrl)
    })
  })

  const provider = new OAuth1Provider({
    oauth_consumer_key: "consumer key",
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    oauth_callback: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })
  await expect(provider.perform(window)).rejects.toThrowError(
    /User denied or invalid response/,
  )
})

test("Access Token failed", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.post("/oauth/request", ctx => {
      expect(ctx.headers["authorization"]).toEqual(
        expect.stringMatching(/^OAuth /),
      )

      ctx.body = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_token_secret: "oauth secret1",
        oauth_callback_confirmed: true,
      })
    })

    router.get("/oauth/authorize", ctx => {
      expect(ctx.query).toEqual({
        oauth_token: "oauth token1",
      })

      const query = querystring.stringify({
        oauth_token: "oauth token1",
        oauth_verifier: "oauth verifier",
      })

      const redirectUrl = `http://localhost:${port}/callback?${query}`
      ctx.redirect(redirectUrl)
    })

    router.post("/oauth/access", ctx => {
      expect(ctx.request.body).toEqual({
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
    request_token_url: `http://localhost:${port}/oauth/request`,
    authenticate_url: `http://localhost:${port}/oauth/authorize`,
    access_token_url: `http://localhost:${port}/oauth/access`,
    oauth_callback: `http://localhost:${port}/callback`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  await expect(provider.perform(window)).rejects.toThrowError(
    /400 - Bad Request : Bad Request/,
  )
})
