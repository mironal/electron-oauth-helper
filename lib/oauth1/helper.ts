import crypto from "crypto"
import Url from "url"

import { postRequest, awaitRedirect } from "../utils"
import querystring from "querystring"
import { BrowserWindow } from "electron"

const createSignature = (
  method: string,
  url: string,
  parameter: { [key: string]: string },
  consumer_secret?: string,
  token_secret?: string,
) => {
  const sorted = Object.keys(parameter)
    .map(key => {
      return {
        key: encodeURIComponent(key),
        value: encodeURIComponent(parameter[key]),
      }
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

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(
    url,
  )}&${encodeURIComponent(output)}`

  const signKey = createSignKey(consumer_secret, token_secret)

  const signature = crypto
    .createHmac("sha1", signKey)
    .update(signatureBaseString)
    .digest("base64")

  return signature
}

const createSignKey = (consumer_secret?: string, token_secret?: string) => {
  const encoded_cs = encodeURIComponent(consumer_secret || "")
  const encoded_ts = encodeURIComponent(token_secret || "")
  return `${encoded_cs}&${encoded_ts}`
}

const createOAuthHeader = (request: { [key: string]: any }) => {
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

export type OAuth1Config = {
  oauth_consumer_key: string
  oauth_consumer_secret?: string
  oauth_callback: string
}

export type OAuth1URLs = {
  request_token_url: string
  authenticate_url: string
  access_token_url: string
}

type OAuth1Parameters = {
  oauth_token?: string
  oauth_verifier?: string
} & OAuth1OptionalParameter

export type OAuth1Credential = {
  oauth_token: string
  oauth_token_secret: string
}

export type OAuth1OptionalParameter = {
  oauth_timestamp?: number
  oauth_version?: string
  oauth_nonce?: string
  oauth_signature_method?: string
}

const makeOAuthParameter = <
  P extends {
    [key: string]: any
  }
>(
  parameter: P,
): { [key: string]: any } => {
  const cloned = { ...parameter }
  cloned.oauth_timestamp =
    parameter.oauth_timestamp || Math.floor(new Date().getTime() / 1000)
  cloned.oauth_version = parameter.oauth_version || "1.0"
  cloned.oauth_nonce =
    cloned.oauth_nonce ||
    crypto
      .createHash("sha256")
      .update(`${parameter}`)
      .digest("base64")
  cloned.oauth_signature_method =
    parameter.oauth_signature_method || "HMAC-SHA1"

  cloned.oauth_consumer_key = parameter.oauth_consumer_key

  return cloned
}

// Step 1
// needs oauth_callback, oauth_consumer_key
export const requestOAuthToken = async (
  url: string,
  config: OAuth1Config,
): Promise<string> => {
  const parameter = makeOAuthParameter(config)

  const signature = createSignature(
    "POST",
    url,
    parameter,
    config.oauth_consumer_secret,
  )
  parameter.oauth_signature = signature

  const oauthHeader = createOAuthHeader(parameter)

  const resp = await postRequest({
    url,
    headers: { Authorization: oauthHeader },
  })
  const body = querystring.parse(resp.body)
  if (typeof body.oauth_token === "string") {
    return Promise.resolve(body.oauth_token)
  }
  return Promise.reject(new Error("A response does not include oauth_token"))
}

// Step 2
export const redirectAuthPage = async <
  R extends Required<Pick<OAuth1Parameters, "oauth_token" | "oauth_verifier">>
>(
  url: string, // authenticate_url
  config: OAuth1Config,
  oauth_token: string,
  window: BrowserWindow,
): Promise<R> => {
  const pageUrl = `${url}?oauth_token=${oauth_token}`

  window.loadURL(pageUrl)
  const resp = await awaitRedirect(
    config.oauth_callback,
    window.webContents.session.webRequest,
  )
  const query = Url.parse(resp, true).query

  if (
    typeof query.oauth_token === "string" &&
    typeof query.oauth_verifier === "string" &&
    query.oauth_token !== "denied"
  ) {
    return Promise.resolve(query as R)
  }
  return Promise.reject(new Error("User denied or invalid response"))
}

// Step 3
export const requestAccessToken = async (
  url: string, // access_token_url
  config: OAuth1Config,
  oauth_token: string,
  oauth_verifier: string,
): Promise<OAuth1Credential> => {
  const parameter = makeOAuthParameter({ oauth_token, ...config })

  const signature = createSignature("POST", url, parameter)
  parameter.oauth_signature = signature

  const oauthHeader = createOAuthHeader(parameter)
  const resp = await postRequest(
    {
      url,
      headers: { Authorization: oauthHeader },
    },
    querystring.stringify({ oauth_verifier }),
  )

  return Promise.resolve(querystring.parse(resp.body) as OAuth1Credential)
}
