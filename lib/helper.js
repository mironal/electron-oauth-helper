const { BrowserWindow } = require("electron")

/**
 *
 * @param {string} redirectURL
 * @param {Electron.WebContents} webContents
 * @param {function} debug
 */
const awaitRedirect = (redirectURL, webContents, debug) => {

  if (!redirectURL || !webContents) {
    return Promise.reject(new Error("Invalid parameter"))
  }

  /**
   * @param {string} url
   */
  const isRedirectURL = url => {
    return url.startsWith(redirectURL)
  }

  return Promise.race([
    new Promise(resolve => webContents.on("will-navigate", (event, url) => {
      debug("will-navigate", url)
      isRedirectURL(url) && resolve(url)
    })),
    new Promise(resolve => webContents.on("did-get-redirect-request", (event, oldURL, newURL) => {
      debug("did-get-redirect-request", newURL)
      isRedirectURL(newURL) && resolve(newURL)
    })),
  ])
}

/**
 *
 * @param {Electron.BrowserWindowConstructorOptions} windowOptions
 */
const createVanillaWindow = windowOptions => {

  const options = Object.assign({
    show:false,
    width: 600,
    height: 800,
    webPreferences: {
      nodeIntegration: false
    },
  }, windowOptions)

  return new BrowserWindow(options)
}

module.exports = {
  awaitRedirect,
  createVanillaWindow,
}
