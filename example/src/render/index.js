const ipc = require("electron").ipcRenderer
const {
  OAuth1Provider,
  OAuth2Provider,
} = require("electron").remote.require("../../../")

const mapTypeToConfig = require("electron").remote.require("../main/config")

const onClick = event => {

  /** @type {string} */
  const type = event.target.innerHTML
  const isRunRendererProcess = document.getElementById("renderer").checked
  if (isRunRendererProcess === true) {
    const config = mapTypeToConfig(type)
    if (!config) {
      console.warn(`Unknown type: ${type}`) // eslint-disable-line
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
        console.log(resp) // eslint-disable-line
      })
  } else {

    ipc.send("oauth", type)
  }
}

const init = () => {
  document.querySelectorAll(".oauth-btn").forEach(elem => elem.addEventListener("click", onClick))
}

if (document.readyState !== "loading") {
  init()
} else {
  document.addEventListener("DOMContentLoaded", init)
}