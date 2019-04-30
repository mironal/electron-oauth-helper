import Debug from "debug"
import Koa from "koa"
import Router from "koa-router"
import bodyParser from "koa-bodyparser"
import { Server } from "http"
import net from "net"
const debug = Debug("eoh:test_util")

export type TestServder = {
  koa: Koa
  port: number
  server: Server
}

export const routing = (koa: Koa) => (routingFn: (router: Router) => void) => {
  const router = new Router()
  routingFn(router)
  koa.use(router.routes())
}

export const startServer = async () => {
  const port = await getPort()
  const koa = new Koa()
  koa.use(bodyParser())
  const server = koa.listen(port)

  return {
    koa,
    port,
    server,
  } as TestServder
}

export const stopServer = async (s: TestServder) => {
  s.server.close()
}

// private

const getPort = async () => {
  return new Promise<number>((resolve, reject) => {
    let port = Math.floor(Math.random() * (60000 - 5000 + 1) + 5000)
    const server = net.createServer()
    server.on("error", (error: any) => {
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
