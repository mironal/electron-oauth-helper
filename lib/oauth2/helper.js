const querystring = require("querystring")
const Url = require("url")

const debug = require("debug")("eoh:oauth2")

const {
  postRequest,
  awaitRedirect,
  omit,
} = require("../utils")

const valueForType = (type, codeFn, tokenFn, passFn, credFn) => {

  if (!type) {
    throw new Error("type must not be null.")
  }

  if (type.includes("id_token")) {
    // eslint-disable-next-line
    console.warn("Multiple-Valued Response Type Combinations is not supportted. Brobably not working...")
  }

  if (type.includes("code")) {
    return codeFn(type)
  }

  if (type.includes("token")) {
    return tokenFn(type)
  }

  if (type.includes("password")) {
    return passFn(type)
  }

  if (type.includes("client_credentials")) {
    return credFn(type)
  }

  throw new Error(`Unsupported type: ${type}`)
}

const createAuthorizeUrl = (config, optional) => {

  const keys = [
    "client_id",
    "redirect_uri",
    "scope",
    "state",
    "response_type",
  ]
  /* eslint-disable security/detect-object-injection */
  const parameter = Object.assign({}, keys.reduce((prev, key) => {
    if (typeof config[key] === "string") {
      prev[key] = config[key]
    }
    return prev
  }, {}), optional || {})
  /* eslint-enable */

  const url = `${config.authorize_url}?${querystring.stringify(parameter)}`
  return url
}

/**
 *
 * @param {object} config
 * @param {Electron.BrowserWindow} window
 * @param {object} auth  - Custom auth parameter.
 * @param {object} token  - Custom token parameter.
 */
const authorizationCodeFlowTask = (config, window, auth, token, headers) => {

  if (!window) {
    return Promise.reject(new Error("window is required"))
  }

  const authorizeUrl = createAuthorizeUrl(config, auth)
  window.loadURL(authorizeUrl)

  return awaitRedirect(config.redirect_uri, window.webContents)
    .then(url => {
      debug(`redirect url: "${url}"`)

      const query = Url.parse(url, true).query

      if (!query) {
        return Promise.reject(new Error(`invalid response: ${url}`))
      }

      if (query.error) {
        const error = new Error("error response")
        error.query = query
        return Promise.reject(error)
      }

      if (!query.code) {
        return Promise.reject(new Error("missing 'code' response."))
      }

      if (config.state && !query.state) {
        return Promise.reject(new Error("missing 'state' response."))
      }

      const parameter = Object.assign({}, {
        client_id: config.client_id,
        grant_type: "authorization_code",
        code: query.code,
      }, token || {})

      if (config.client_secret) {
        parameter.client_secret = config.client_secret
      }

      if (config.redirect_uri) {
        parameter.redirect_uri = config.redirect_uri
      }

      if (query.state) {
        parameter.state = query.state
      }

      return postRequest(config.access_token_url, parameter, headers)
    })
}

/**
 *
 * @param {object} config
 * @param {Electron.BrowserWindow} window
 * @param {object} auth - Custom token parameter.
 */
const implicitFlowTask = (config, window, auth) => {

  if (!window) {
    return Promise.reject(new Error("window is required"))
  }

  const authorizeUrl = createAuthorizeUrl(config, auth)
  setTimeout(() => {
    window.loadURL(authorizeUrl)
  }, 100)
  debug("start implicitFlowTask:", authorizeUrl, config.redirect_uri)
  return awaitRedirect(config.redirect_uri, window.webContents, debug)
    .then(url => {
      debug(`redirect url: "${url}"`)
      const hash = Url.parse(url, false).hash.replace(/^#/, "")
      return querystring.parse(hash)
    })
}

/**
 *
 * @param {object} config
 * @param {Electron.BrowserWindow} window - This is not used.
 * @param {object} auth - This is not used.
 * @param {object} token - Custom token parameter.
 */
const resourceOwnerPasswordCredentialsFlowTask = (config, window, auth, token) => {
  const parameter = omit(config, "access_token_url")
  return postRequest(config.access_token_url, parameter, token)
}

/**
 *
 * @param {object} config
 * @param {object} auth - Custom auth parameter. This is not used.
 * @param {object} token - Custom token parameter.
 */
const clientCredentialsFlowTask = (config, auth, token) => {
  const parameter = omit(config, "access_token_url")
  return postRequest(config.access_token_url, parameter, token)
}

/**
 * @param {object} config
 */

const validate = config => {
  const type = config.response_type || config.grant_type || "code"
  /* @type {[string]} */
  const keys = valueForType(type,
    () => {
      return [
        "client_id",
        "authorize_url",
        "access_token_url",
        "redirect_uri",
      ]
    },
    () => {
      return [
        "client_id",
        "authorize_url",
        "redirect_uri",
      ]
    },
    () => {
      return [
        "access_token_url",
        "username",
        "password",
      ]
    },
    () => {
      return [
        "access_token_url",
      ]
    })
  const test = k => {
    if (typeof k === "string") {
      k = [k]
    }
    // eslint-disable-next-line
    return k.find(key => typeof config[key] === "string")
  }
  const missing = keys.find(k => !test(k))
  if (missing) {
    return new Error(`${missing} is required for ${type}`)
  }
}

/**
 * @param {string} type
 * @returns {function|undefined}
 */
const mapGrantTypeToTask = type => (
  valueForType(type,
    () => {
      return authorizationCodeFlowTask
    },
    () => {
      return implicitFlowTask
    },
    () => {
      return resourceOwnerPasswordCredentialsFlowTask
    },
    () => {
      return clientCredentialsFlowTask
    })
)

/**
 *
 * @param {string} type
 *
 * @returns {boolean|undefined}
 *
 */
const needWindowForGrantType = type => (
  valueForType(type,
    () => {
      return true
    },
    () => {
      return true
    },
    () => {
      return false
    },
    () => {
      return false
    })
)

module.exports = {
  validate,
  mapGrantTypeToTask,
  needWindowForGrantType,
}
