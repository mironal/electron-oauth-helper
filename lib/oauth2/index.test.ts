import OAuth2Provider from "."
import { routing, startServer, stopServer, TestServder } from "../__test_utils"
import { BrowserWindow } from "electron"
import querystring from "querystring"

let server: TestServder
beforeEach(async () => {
  server = await startServer()
})

afterEach(async () => {
  await stopServer(server)
})

test("Authorization Code Grant: An error is thrown if config is empty", () => {
  expect(() => new OAuth2Provider({})).toBeTruthy()
})

test("Authrorization Code Grant: An error is thrown if config is incomplete", () => {
  expect(() => {
    new OAuth2Provider({
      authorize_url: "a",
    })
  }).toThrow()

  expect(() => {
    new OAuth2Provider({
      response_type: "code",
      authorize_url: "a",
    })
  }).toThrow()

  expect(() => {
    new OAuth2Provider({
      response_type: "code",
      authorize_url: "a",
      access_token_url: "b",
    })
  }).toThrow()

  expect(() => {
    new OAuth2Provider({
      response_type: "code",
      authorize_url: "a",
      access_token_url: "b",
    })
  }).toThrow()

  expect(() => {
    new OAuth2Provider({
      response_type: "code",
      authorize_url: "a",
      access_token_url: "b",
      client_id: "d",
    })
  }).toThrow()
})

test("Authrorization Code Gran: An instance can be created", () => {
  expect(
    new OAuth2Provider({
      response_type: "code",
      authorize_url: "a",
      access_token_url: "b",
      client_id: "d",
      redirect_uri: "f",
    }),
  ).not.toBeNull()

  expect(
    new OAuth2Provider({
      authorize_url: "a",
      access_token_url: "b",
      client_id: "d",
      redirect_uri: "f",
    }),
  ).not.toBeNull()
})

test("Authorization Code Grant: request success", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "code",
      })
      const redirectURL = `${ctx.query.redirect_uri}?code=abcd`
      ctx.redirect(redirectURL)
    })

    router.post("/token", ctx => {
      expect(ctx.request.body).toEqual({
        grant_type: "authorization_code",
        code: "abcd",
        redirect_uri: `http://localhost:${port}/redirect`,
        client_id: "client id",
      })

      ctx.body = {
        access_token: "token",
        token_type: "example",
        expires_in: 3600,
        refresh_token: "refresh",
      }
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    access_token_url: `http://localhost:${port}/token`,
    response_type: "code",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  const resp = await provider.perform(window)
  if (typeof resp !== "string") {
    expect(JSON.parse(resp.body)).toEqual({
      access_token: "token",
      token_type: "example",
      expires_in: 3600,
      refresh_token: "refresh",
    })
  } else {
    throw new Error("Invalid response")
  }
})

test("Authorization Code Grant: request success with custom parameter", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "code",
        custom_auth: "custom auth param",
      })
      const redirectURL = `${ctx.query.redirect_uri}?code=abcd`
      ctx.redirect(redirectURL)
    })

    router.post("/token", ctx => {
      expect(ctx.request.body).toEqual({
        grant_type: "authorization_code",
        custom_token: "custom token param",
        code: "abcd",
        redirect_uri: `http://localhost:${port}/redirect`,
        client_id: "client id",
      })

      ctx.body = {
        access_token: "token",
        token_type: "example",
        expires_in: 3600,
        refresh_token: "refresh",
      }
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    access_token_url: `http://localhost:${port}/token`,
    response_type: "code",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  provider.on("before-authorize-request", query => {
    query["custom_auth"] = "custom auth param"
  })
  provider.on("before-access-token-request", parameter => {
    parameter["custom_token"] = "custom token param"
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })
  const resp = await provider.perform(window)

  if (typeof resp !== "string") {
    expect(JSON.parse(resp.body)).toEqual({
      access_token: "token",
      token_type: "example",
      expires_in: 3600,
      refresh_token: "refresh",
    })
  } else {
    throw new Error("Invalid response")
  }
})

test("Authorization Code Grant: authorize request failure", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "code",
      })
      const redirectURL = `${ctx.query.redirect_uri}?error=access_denied`
      ctx.redirect(redirectURL)
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    access_token_url: `http://localhost:${port}/token`,
    response_type: "code",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  await expect(provider.perform(window)).rejects.toThrow(
    /^Error response: access_denied/,
  )
})

test("Authorization Code Grant: token request failure", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "code",
      })
      const redirectURL = `${ctx.query.redirect_uri}?code=abcd`
      ctx.redirect(redirectURL)
    })

    router.post("/token", ctx => {
      expect(ctx.request.body).toEqual({
        grant_type: "authorization_code",
        code: "abcd",
        redirect_uri: `http://localhost:${port}/redirect`,
        client_id: "client id",
      })

      ctx.status = 400
      ctx.body = {
        error: "invalid_request",
      }
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    access_token_url: `http://localhost:${port}/token`,
    response_type: "code",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  await expect(provider.perform(window)).rejects.toThrow(
    /^400 - Bad Request : {"error":"invalid_request"}/,
  )
})

test("Implicit Grant: request success", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "token",
      })
      const redirectURL = `${
        ctx.query.redirect_uri
      }#access_token=abcd&token_type=bearer`
      ctx.redirect(redirectURL)
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    response_type: "token",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })
  const resp = await provider.perform(window)
  if (typeof resp === "string") {
    expect(querystring.parse(resp)).toEqual({
      access_token: "abcd",
      token_type: "bearer",
    })
  } else {
    throw new Error("Invalid response")
  }
})

test("Implicit Grant: request success with custom parameter", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "token",
        hoge: "⁽⁽◝( ˙ ꒳ ˙ )◜⁾⁾",
      })
      const redirectURL = `${
        ctx.query.redirect_uri
      }#access_token=abcd&token_type=bearer`
      ctx.redirect(redirectURL)
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    response_type: "token",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  provider.on("before-authorize-request", query => {
    query["hoge"] = "⁽⁽◝( ˙ ꒳ ˙ )◜⁾⁾"
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })
  const resp = await provider.perform(window)
  if (typeof resp === "string") {
    expect(querystring.parse(resp)).toEqual({
      access_token: "abcd",
      token_type: "bearer",
    })
  } else {
    throw new Error("Invalid response")
  }
})

test("Implicit Grant: request failure", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.get("/authorize", ctx => {
      expect(ctx.query).toEqual({
        client_id: "client id",
        redirect_uri: `http://localhost:${port}/redirect`,
        response_type: "token",
      })
      const redirectURL = `${ctx.query.redirect_uri}#error=access_denied`
      ctx.redirect(redirectURL)
    })
  })

  const provider = new OAuth2Provider({
    authorize_url: `http://localhost:${port}/authorize`,
    response_type: "token",
    client_id: "client id",
    redirect_uri: `http://localhost:${port}/redirect`,
  })

  const window = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
  })

  await expect(provider.perform(window)).rejects.toThrow(
    /^Error response: error=access_denied/,
  )
})

test("Resource Owner Password Credentials Grant", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.post("/token", ctx => {
      expect(ctx.request.body).toEqual({
        grant_type: "password",
        scope: "scope",
        username: "user",
        password: "pass",
      })

      ctx.body = {
        access_token: "access token",
        token_type: "bearer",
      }
    })
  })

  const provider = new OAuth2Provider({
    access_token_url: `http://localhost:${port}/token`,
    grant_type: "password",
    scope: "scope",
    username: "user",
    password: "pass",
  })

  const resp = await provider.perform()
  if (typeof resp === "string") {
    throw new Error("Invalid response")
  }

  expect(JSON.parse(resp.body)).toEqual({
    access_token: "access token",
    token_type: "bearer",
  })
})

test("Client Credentials Grant", async () => {
  const { koa, port } = server

  routing(koa)(router => {
    router.post("/token", ctx => {
      expect(ctx.request.body).toEqual({
        grant_type: "client_credentials",
        scope: "scope",
      })

      ctx.body = {
        access_token: "access token",
        token_type: "bearer",
      }
    })
  })

  const provider = new OAuth2Provider({
    access_token_url: `http://localhost:${port}/token`,
    grant_type: "client_credentials",
    scope: "scope",
  })

  const resp = await provider.perform()
  if (typeof resp === "string") {
    throw new Error("Invalid response")
  }

  expect(JSON.parse(resp.body)).toEqual({
    access_token: "access token",
    token_type: "bearer",
  })
})
