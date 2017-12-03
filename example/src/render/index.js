const ipc = require("electron").ipcRenderer

const onClick = event => {

  const provider = event.target.innerHTML
  ipc.send("oauth", provider)
}

const init = () => {
  document.querySelectorAll(".oauth-btn").forEach(elem => elem.addEventListener("click", onClick))
}

if (document.readyState !== "loading") {
  init()
} else {
  document.addEventListener("DOMContentLoaded", init)
}