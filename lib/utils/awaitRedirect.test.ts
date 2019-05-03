import { BrowserWindow } from "electron"
import { awaitRedirect } from "./awaitRedirect"
import { TestServder, startServer, stopServer, routing } from "../__test_utils"

let server: TestServder
let endpoint: string

beforeAll(async () => {
  server = await startServer()
  const { koa, port } = server
  endpoint = `http://localhost:${port}/`
  routing(koa)(router => {
    router.get("/", ctx => {
      if (ctx.query.r) {
        ctx.redirect(ctx.query.r)
      } else {
        ctx.body = "hello"
      }
    })
  })
})

afterAll(async () => {
  await stopServer(server)
})

test("awaitRedirect got onBeforeRedirect", async () => {
  const url = "https://www.google.com/"
  const w = new BrowserWindow({ show: false })

  setImmediate(() => {
    w.loadURL(endpoint + "?r=" + url)
  })

  const redirectUrl = await awaitRedirect(url, w.webContents.session.webRequest)
  expect(redirectUrl).toEqual(url)
})

test("awaitRedirect got url onBeforeRequest", async () => {
  const w = new BrowserWindow({ show: false })

  setImmediate(() => {
    w.loadURL(endpoint)
  })

  const redirectUrl = await awaitRedirect(
    endpoint,
    w.webContents.session.webRequest,
  )
  expect(redirectUrl).toEqual(endpoint)
})
