const { BrowserWindow } = require("electron")

const {
  validate,
  mapGrantTypeToTask,
  needWindowForGrantType,
} = require("./helper")

class OAuth2Provider {

  /**
   * @param {object} config - OAuth2 config.
   */
  constructor(config) {
    const error = validate(config)
    if (error) {
      throw error
    }
    this.config = config
    this.customAuthorizationRequestParameter = {}
    this.customAccessTokenRequestParameter = {}

    /** @type {boolean} */
    this.finished = false
  }

  /**
   * Sets the custom parameter for Authorization Request.
   *
   * This can be used to include your own parameters in your request
   * that are not included in the OAuth2 specification.
   *
   * @example
   * ```js
   *  const provider = new OAuth2Provider({})
   *    .withCustomAuthorizationRequestParameter({hoge: "huga"})
   *    .withCustomAccessTokenRequestParameter({foo: "bar"})
   * ```
   *
   * @param {object} param
   */
  withCustomAuthorizationRequestParameter(param) {
    this.customAuthorizationRequestParameter = param
    return this
  }

  /**
   * Sets the custom parameter for  Access Token Request.
   *
   * This can be used to include your own parameters in your request
   * that are not included in the OAuth2 specification.

   * @example
   * ```js
   *  const provider = new OAuth2Provider(config)
   *    .withCustomAuthorizationRequestParameter({hoge: "huga"})
   *    .withCustomAccessTokenRequestParameter({foo: "bar"})
   * ```
   *
   * @param {object} param
   */
  withCustomAccessTokenRequestParameter(param) {
    this.customAccessTokenRequestParameter = param
    return this
  }

  /**
   * Initiate OAuth2 flow.
   *
   * if grant_type is "code" or "token", you need to pass "window" argument.
   * In other cases it is not necessary.
   *
   * @example
   * ```js
   *  const window = new BrowserWindow({
   *    width: 600,
   *    height: 800,
   *    webPreferences: {
   *      nodeIntegration: false // We recommend disabling nodeIntegration for security.
   *      contextIsolation: true // We recommend enabling contextIsolation for security.
   *      // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
   *    },
   *  })
   *  const provider = new OAuth2Provider(config)
   *  provider.perform(window)
   *    .then(console.log)
   *    .catch(console.error)
   * ```
   *
   * @param {Electron.BrowserWindow=} window
   * @returns {Promise<any>}
   */
  perform(window) {

    const config = this.config
    /** @type {string} */
    const type = config.response_type || config.grant_type || "code"
    const task = mapGrantTypeToTask(type)

    if (needWindowForGrantType(type)) {
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
      this.finished = false

      window.once("show", () => {
        window.once("close", () => {
          if (this.finished === false) {
            this.userCancelError = new Error("User cancelled")
          }
        })
      })
    }

    return task(config, window, this.customAuthorizationRequestParameter, this.customAccessTokenRequestParameter)
      .then(resp => {
        this.finished = true

        if (this.userCancelError) {
          return Promise.reject(this.userCancelError)
        }

        if (resp.error) {
          return Promise.reject(resp)
        }

        return Promise.resolve(resp)
      })
  }
}

module.exports = OAuth2Provider
