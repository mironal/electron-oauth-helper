const Url = require("url")
const querystring = require("querystring")
const debug = require("debug")("eoh:oauth1")
const { BrowserWindow } = require("electron")

const {
  awaitRedirect,
} = require("../utils")

const {
  oauthPOSTRequest,
} = require("./helper")

class OAuth1Provider {

  /**
   * @param {object} config - OAuth1 config.
   */
  constructor(config) {
    this.config = config
  }

  /**
   * @param {Electron.BrowserWindow} window
   * @returns {Promise<any>}
   */
  perform(window) {

    const config = this.config

    this.finished = false
    return new Promise((resolve, reject) => {

      // Step 1: Obtaining a request token
      return oauthPOSTRequest(config.request_token_url, {}, {
        oauth_callback: config.callback_url,
        oauth_consumer_key: config.oauth_consumer_key,
        oauth_consumer_secret: config.oauth_consumer_secret,
      })
        .then(query => {
          const resp = querystring.parse(query)
          debug("Step 1 response", resp)
          if (!window) {

            // Backward compatibility
            window = new BrowserWindow({
              width: 600,
              height: 800,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
              },
            })
            // eslint-disable-next-line
            console.warn(`In the future release the "window" parameter will be mandatory when grant_type is ${type}!`)
            // next release: return Promise.reject(new Error(`if grant-type is "${type}", window is required.`))
          }

          window.once("close", () => {
            if (this.finished === false) {
              reject(new Error("window closed"))
            }
          })

          // Step 2: Redirecting the user
          const url = `${config.authenticate_url}?oauth_token=${resp.oauth_token}`
          window.loadURL(url)
          return awaitRedirect(config.callback_url, window.webContents, debug)
        })
        .then(resp => {

          debug("Step 2 response", resp)
          // Step 3: Converting the request token to an access token
          const query = Url.parse(resp, true).query
          if (!query.oauth_token || query.oauth_token === "denied" || !query.oauth_verifier) {
            this.finished = true
            return Promise.reject(new Error("User denied or invalid response"))
          }
          return oauthPOSTRequest(config.access_token_url,
            { oauth_verifier: query.oauth_verifier },
            {
              oauth_consumer_key: config.oauth_consumer_key,
              oauth_consumer_secret: config.oauth_consumer_secret,
              oauth_token: query.oauth_token
            })
        })
        .then(resp => {
          debug("Step 3 response", resp)
          this.finished = true
          resolve(querystring.parse(resp))
        })
        .catch(error => reject(error))

    })
  }
}

module.exports = OAuth1Provider
