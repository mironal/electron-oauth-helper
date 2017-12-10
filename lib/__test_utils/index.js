const Koa = require("koa")
const Router = require("koa-router")
const bodyParser = require("koa-bodyparser")
const net = require("net")
const debug = require("debug")("eoh:test_util")

const routing = koa => routingFn => {
  const router = new Router()
  routingFn(router)
  koa.use(router.routes())
}

const startServer = async t => {
  const port = await getPort()
  const koa = new Koa()
  koa.use(bodyParser())
  const server = koa.listen(port)
  t.context = {
    koa,
    port,
    server,
  }
}

const stopServer = async t => {
  if (t && t.context && t.context.server) {
    await t.context.server.close()
  }
}

// private

const getPort = async () => {

  return new Promise((resolve, reject) => {

    let port = Math.floor(Math.random() * (60000 - 5000 + 1) + 5000)
    const server = net.createServer()
    server.on("error", error => {
      debug("got error:", error)
      server.close(() => {
        port += 1
        if (error.code !== "EADDRINUSE" || port >= 65535) {
          server.removeAllListeners()
          reject(error)
        }
        setImmediate(() => {
          server.listen(port)
        })
      })
    })
    server.on("listening", () => {
      debug("connected:", port)
      server.removeAllListeners()
      server.close(() => {
        resolve(port)
      })
    })
    debug("try connect:", port)
    server.listen(port)
  })
}

module.exports = {
  startServer,
  stopServer,
  routing
}
