
const querystring = require("querystring")
const Url = require("url")

const {
  postRequest
} = require("./request")

const {
  awaitRedirect,
  createVanillaWindow
} = require("./helper")

const debug = require("debug")("eoh:OAuth2")

const createAuthorizeURL = config => {
  const keys = [
    "client_id", // GitHub, Google
    "redirect_url", // GitHub
    "redirect_uri", // Google
    "scope", // GitHub, Google
    "state", // GitHub, Google
    "response_type", // Google
    "access_type", // Google
    "include_granted_scopes", // Google
    "login_hint", // Google
    "prompt", // Google
  ]
  const parameter = keys.reduce((prev, key) => {
    if (config[key]) {
      prev[key] = config[key]
    }
    return prev
  }, {})

  const url = `${config.authorize_url}?${querystring.stringify(parameter)}`
  debug(`Authrize URL: "${url}"`)
  return url
}

const Flow = {
  IMPLICIT: "IMPLICIT",
  AUTHORIZE_CODE: "AUTHORIZE_CODE",
}

const detectFlow = config => {
  if (config.response_type === "token") {
    debug("Auth flow IMPLICIT detected")
    return Flow.IMPLICIT
  }

  debug("Auth flow AUTHORIZE_CODE detected")
  return Flow.AUTHORIZE_CODE
}

const implicitFlow = (config, webContents) => {

  return awaitRedirect(config.redirect_uri || config.redirect_url, webContents, debug)
    .then(url => {
      debug(`redirect url: "${url}"`)
      const hash = Url.parse(url, true).hash.replace(/^#/, "")
      return querystring.parse(hash)
    })
}

const authorizationCodeFlow = (config, webContents) => {

  return awaitRedirect(config.redirect_uri || config.redirect_url, webContents, debug)
    .then(url => {
      debug(`redirect url: "${url}"`)
      const query = Url.parse(url, true).query

      const resp = Object.assign({}, query)

      const parameter = {
        client_id: config.client_id,
        client_secret: config.client_secret
      }

      if (resp.code) {
        parameter.code = resp.code
        parameter.grant_type = "authorization_code"
      }

      if (resp.state) {
        parameter.state = resp.state
      }

      if (config.redirect_uri) {
        parameter.redirect_uri = config.redirect_uri
      }

      return postRequest(config.access_token_url, parameter)
    })
}

class OAuth2Provider {

  /**
   *
   * @param {object} config - OAuth2 config.
   */
  constructor(config) {
    this.config = config
  }

  /**
   * @param {Electron.BrowserWindowConstructorOptions=} windowOptions - electron window options.
   * @returns {Promise<any>}
   */
  perform(windowOptions) {

    this.finished = false
    const config = this.config

    this.window = createVanillaWindow(windowOptions)

    const url = createAuthorizeURL(config)
    setImmediate(() => {
      this.window.loadURL(url)
      this.window.show()
    })

    return new Promise((resolve, reject) => {

      this.window.on("close", () => {
        this.window = null
        if (this.finished === false) {
          reject(new Error("window closed"))
        }
      })

      const flow = (() => {
        switch (detectFlow(config)) {
          case Flow.IMPLICIT:
            return implicitFlow(config, this.window.webContents)
          case Flow.AUTHORIZE_CODE:
            return authorizationCodeFlow(config, this.window.webContents)
          default:
            console.warn("Unkown flow detect.") // eslint-disable-line
            return Promise.resolve()
        }
      })()
      flow.then(resp => {
        this.finished = true
        this.window.close()
        resolve(resp)
      })
    })

  }
}

module.exports = OAuth2Provider
