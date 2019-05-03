import Debug from "debug"
import {
  requestOAuthToken,
  requestAccessToken,
  redirectAuthPage,
  OAuth1Config,
  OAuth1URLs,
} from "./helper"
import { BrowserWindow } from "electron"
import { pick } from "../utils"

const debug = Debug("eoh:oauth1")

export default class OAuth1Provider {
  public config: OAuth1Config
  public urls: OAuth1URLs
  private finished: Boolean = false

  constructor(config: OAuth1Config & OAuth1URLs) {
    this.config = pick(config, [
      "oauth_consumer_key",
      "oauth_consumer_secret",
      "oauth_callback",
    ])

    this.urls = pick(config, [
      "request_token_url",
      "authenticate_url",
      "access_token_url",
    ])
  }

  public perform(window: BrowserWindow) {
    this.finished = false
    return new Promise((resolve, reject) => {
      // Step 1: Obtaining a request token
      return requestOAuthToken(this.urls.request_token_url, this.config)
        .then(oauth_token => {
          debug("Step 1 response", oauth_token)

          window.once("close", () => {
            if (this.finished === false) {
              reject(new Error("window closed"))
            }
          })

          // Step 2: Redirecting the user
          return redirectAuthPage(
            this.urls.authenticate_url,
            this.config,
            oauth_token,
            window,
          )
        })
        .then(resp => {
          debug("Step 2 response", resp)

          // Step 3: Converting the request token to an access token
          return requestAccessToken(
            this.urls.access_token_url,
            this.config,
            resp.oauth_token,
            resp.oauth_verifier,
          )
        })
        .then(resp => {
          debug("Step 3 response", resp)
          this.finished = true
          resolve(resp)
        })
        .catch(error => reject(error))
    })
  }
}
