/* eslint-disable no-console */

const ipc = require("electron").ipcRenderer
const {
  OAuth1Provider,
  OAuth2Provider,
} = require("electron").remote.require("../../../")

/** @type {firebase} */
const firebase = require("electron").remote.require("firebase")
const querystring = require("querystring")

const mapTypeToConfig = require("electron").remote.require("../main/config")

const onClick = event => {

  /** @type {string} */
  const type = event.target.innerHTML
  const isRunRendererProcess = document.getElementById("renderer").checked
  const isLinkFirebaseAuth = document.getElementById("firebase-auth").checked
  if (isRunRendererProcess === true) {
    const config = mapTypeToConfig(type)
    if (!config) {
      console.warn(`Unknown type: ${type}`)
      return
    }

    const Provider = (() => {
      if (type.startsWith("Twitter")) {
        return OAuth1Provider
      } else {
        return OAuth2Provider
      }
    })()
    const provider = new Provider(config)
    provider.perform()
      .then(resp => {
        console.log(resp)

        if (isLinkFirebaseAuth && type === "GitHub") {

          const query = querystring.parse(resp)

          // https://firebase.google.com/docs/auth/web/github-auth#handle_the_sign-in_flow_manually
          const credential = firebase.auth.GithubAuthProvider.credential(query.access_token)
          firebase.auth().signInWithCredential(credential)
            .then(result => {
              console.log(result)
            })
            .catch(error => {
              console.error(error)
            })
        }
      })
  } else {

    ipc.send("oauth", type)
  }
}

const init = () => {
  document.querySelectorAll(".oauth-btn").forEach(elem => elem.addEventListener("click", onClick))
  document.getElementById("link-firebase-page").addEventListener("click", event => {
    event.preventDefault()
    require("electron").remote.shell.openExternal(event.target.href)
  })
}

if (document.readyState !== "loading") {
  init()
} else {
  document.addEventListener("DOMContentLoaded", init)
}