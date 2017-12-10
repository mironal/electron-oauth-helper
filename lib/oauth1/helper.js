const debug = require("debug")("eoh:oauth1")
const crypto = require("crypto")
const {
  postRequest,
} = require("../utils")

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
    // eslint-disable-next-line
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
      // eslint-disable-next-line
      if (!request[current]) {
        return prev
      }
      const ekey = encodeURIComponent(current)
      // eslint-disable-next-line
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

  return postRequest(url, parameter, {
    "Authorization": oauthHeader,
  })
}

module.exports = {
  oauthPOSTRequest
}
