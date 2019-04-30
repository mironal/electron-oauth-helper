import Debug from "debug"

const debug = Debug("eoh:helper")

export const awaitRedirect = (
  redirectURL: string,
  webContents: Electron.webContents,
): Promise<string> => {
  if (!redirectURL || !webContents) {
    return Promise.reject(new Error("Invalid parameter"))
  }

  const isRedirectURL = (url: string) => {
    return url.startsWith(redirectURL)
  }
  return new Promise(resolve => {
    debug("Await redirect", redirectURL)

    let filterUrl = redirectURL
    if (filterUrl.endsWith("*")) {
      filterUrl += "*"
    }

    webContents.session.webRequest.onBeforeRequest((detail, callback) => {
      debug("will request", detail)
      if (isRedirectURL(detail.url)) {
        callback({ cancel: true })
        debug("resolve with", detail.url)
        resolve(detail.url)
        return
      }
      callback({ cancel: false })
    })

    webContents.session.webRequest.onBeforeRedirect(
      { urls: [filterUrl] },
      detail => {
        debug("will redirect", detail)
        if (isRedirectURL(detail.redirectURL)) {
          debug("resolve with", detail.redirectURL)
          resolve(detail.redirectURL)
          return
        }
      },
    )
  })
}
