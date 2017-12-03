const Url = require("url")
const { net } = require("electron")
const querystring = require("querystring")
const crypto = require("crypto")
const debug = require("debug")("eoh:OAuth1")

const {
  awaitRedirect,
  createVanillaWindow,
} = require("./helper")

/**
 *
 * @param {string} method
 * @param {string} url
 * @param {object} parameter
 * @param {string} consumer_secret
 * @param {string} token_secret
 */
const createSignature = (method, url, parameter, consumer_secret, token_secret) => {

  const sorted = Object.keys(parameter).map(key => {
    return { key: encodeURIComponent(key), value: encodeURIComponent(parameter[key]) }
  })
    .sort((a, b) => {
      return a.key.localeCompare(b.key)
    })

  const output = sorted.reduce((prev, current) => {
    if (prev.length !== 0) {
      prev = `${prev}&`
    }
    return `${prev}${current.key}=${current.value}`
  }, "")

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(output)}`

  const signKey = createSignKey(consumer_secret, token_secret)

  const signature = crypto.createHmac("sha1", signKey).update(signatureBaseString).digest("base64")

  return signature
}

const createSignKey = (consumer_secret, token_secret) => {
  const encoded_cs = encodeURIComponent(consumer_secret || "")
  const encoded_ts = encodeURIComponent(token_secret || "")
  return `${encoded_cs}&${encoded_ts}`
}

const createOAuthHeader = request => {

  const INIT = "OAuth "
  const dst = Object.keys(request)
    .sort((a, b) => {
      return a.localeCompare(b)
    })
    .reduce((prev, current) => {
      if (!request[current]) {
        return prev
      }
      const ekey = encodeURIComponent(current)
      const evalue = `"${encodeURIComponent(request[current])}"`
      if (prev !== INIT) {
        prev = `${prev}, `
      }
      return `${prev}${ekey}=${evalue}`
    }, INIT)

  return dst
}

/**
 * @param {string} url
 * @param {object} parameter - POST parameter
 * @returns {Promise<string>}
 */
const oauthPOSTRequest = (url, parameter, oauth) => {

  const oauthParameter = Object.assign({}, parameter, {
    oauth_consumer_key: oauth.oauth_consumer_key || "",
    oauth_timestamp: oauth.oauth_timestamp || Math.floor((new Date().getTime() / 1000)),
    oauth_version: oauth.oauth_version || "1.0",
    oauth_nonce: oauth.oauth_nonce || crypto.createHash("sha256").update(`${parameter}`).digest("base64"),
    oauth_signature_method: oauth.oauth_signature_method || "HMAC-SHA1"
  })

  if (oauth.oauth_callback) {
    oauthParameter.oauth_callback = oauth.oauth_callback
  }

  if (oauth.oauth_token) {
    oauthParameter.oauth_token = oauth.oauth_token
  } else if (oauth.oauth_request_token) {
    oauthParameter.oauth_token = oauth.oauth_request_token
  }

  const signature = createSignature("POST", url, oauthParameter, oauth.oauth_consumer_secret, oauth.oauth_token_secret)
  oauthParameter.oauth_signature = signature

  const oauthHeader = createOAuthHeader(oauthParameter)
  debug("OAuth header", oauthHeader)

  return new Promise((resolve, reject) => {

    const postData = querystring.stringify(parameter)

    const request = net.request({
      url,
      method: "POST",
      headers: {
        "Authorization": oauthHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData)
      }
    })

    request.on("response", response => {

      const datas = []

      response.on("data", chunk => {
        datas.push(chunk)
      })

      response.on("end", () => {
        const data = Buffer.concat(datas)
        const str = data.toString("utf8")
        resolve(str)
      })

      response.on("error", error => {
        reject(error)
      })
    })

    request.write(postData, "utf8")
    request.end()
  })
}


class OAuth1Provider {

  /**
   * @param {object} config - OAuth1 config.
   */
  constructor(config) {
    this.config = config
  }

  /**
   * @param {Electron.BrowserWindowConstructorOptions=} windowOptions - electron window options.
   * @returns {Promise<any>}
   */
  perform(windowOptions) {

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

          this.window = createVanillaWindow(windowOptions)

          this.window.on("close", () => {
            this.window = null
            if (this.finished === false) {
              reject(new Error("window closed"))
            }
          })

          // Step 2: Redirecting the user
          const url = `${config.authenticate_url}?oauth_token=${resp.oauth_token}`
          setImmediate(() => {
            this.window.loadURL(url)
            this.window.show()
          })
          return awaitRedirect(config.callback_url, this.window.webContents, debug)
        })
        .then(resp => {

          debug("Step 2 response", resp)

          // Step 3: Converting the request token to an access token
          const query = Url.parse(resp, true).query
          if (query.denied) {
            this.window.close()
            return Promise.reject(new Error("User denied"))
          }
          return oauthPOSTRequest(config.access_token_url, { oauth_verifier: query.oauth_verifier }, {
            oauth_consumer_key: config.oauth_consumer_key,
            oauth_consumer_secret: config.oauth_consumer_secret,
            oauth_token: query.oauth_token
          })
        })
        .then(resp => {
          debug("Step 3 response", resp)
          this.finished = true
          this.window.close()
          resolve(querystring.parse(resp))
        })

    })

  }
}

module.exports = OAuth1Provider
