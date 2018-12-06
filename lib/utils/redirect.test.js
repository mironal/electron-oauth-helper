const test = require("ava")
const EventEmitter = require("events").EventEmitter

const {
  awaitRedirect,
} = require("./redirect")

test.skip("awaitRedirect got url when will-navigate emitted", async t => {

  const url = "https://www.google.com"
  const webContents = new EventEmitter()

  setImmediate(() => {
    webContents.emit("will-navigate", {}, "https://other.example.com")
    webContents.emit("will-navigate", {}, url + "/hoge")
  })

  const redirectUrl = await awaitRedirect(url, webContents)

  t.is(redirectUrl, url + "/hoge")
})

test.skip("awaitRedirect got url when did-get-redirect-request emitterd$", async t => {

  const url = "https://www.google.com"
  const webContents = new EventEmitter()

  setImmediate(() => {
    webContents.emit("did-get-redirect-request", {}, "", "https://other.example.com")
    webContents.emit("did-get-redirect-request", {}, "", url + "/hoge")
  })

  const redirectUrl = await awaitRedirect(url, webContents)

  t.is(redirectUrl, url + "/hoge")
})
