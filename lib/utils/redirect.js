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

    webContents.session.webRequest.onBeforeRedirect(
      { urls: [redirectURL] },
      detail => {
        debug("will redirect", detail.redirectURL)
        if (isRedirectURL(detail.redirectURL)) {
          resolve(detail.redirectURL)
        }
      }
    )
  })
}

module.exports = {
  awaitRedirect
}
