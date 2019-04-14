const debug = require("debug")("eoh:helper")

/**
 *
 * @param {string} redirectURL
 * @param {Electron.WebContents} webContents
 */
const awaitRedirect = (redirectURL, webContents) => {

  if (!redirectURL || !webContents) {
    return Promise.reject(new Error("Invalid parameter"))
  }

  /**
   * @param {string} url
   */
  const isRedirectURL = url => {
    return url.startsWith(redirectURL)
  }
  return new Promise(resolve => {

    debug("Await redirect", redirectURL)

    let filterUrl = redirectURL
    if (filterUrl.endsWith("*")) {
      filterUrl += "*"
    }

    webContents.session.webRequest.onBeforeRequest(
      (detail, callback) => {
        debug("will request", detail)
        if (isRedirectURL(detail.url)) {
          callback({cancel:true})
          debug("resolve with", detail.url)
          resolve(detail.url)
          return
        }
        callback({cancel:false})
      })

    webContents.session.webRequest.onBeforeRedirect(
      {urls: [filterUrl]},
      (detail, callback) => {
        debug("will redirect", detail)
        if (isRedirectURL(detail.redirectURL)) {
          callback({cancel:true})
          debug("resolve with", detail.redirectURL)
          resolve(detail.redirectURL)
          return
        }
        callback({cancel:false})
      }
    )
  })
}

module.exports = {
  awaitRedirect
}
