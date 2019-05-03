/* eslint-disable no-console */

const { app, BrowserWindow } = require("electron")
const path = require("path")
const url = require("url")
const ipc = require("electron").ipcMain

const OAuth1Provider = require("../../../dist/oauth1")
const OAuth2Provider = require("../../../dist/oauth2")

const firebase = require("firebase")

// eslint-disable-next-line node/no-missing-require
const mapTypeToConfig = require("./config")
if (mapTypeToConfig("Firebase")) {
  firebase.initializeApp(mapTypeToConfig("Firebase"))
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "../render", "index.html"),
      protocol: "file:",
      slashes: true,
    }),
  )

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

ipc.on("oauth", (event, type) => {
  const config = mapTypeToConfig(type)
  if (!config) {
    console.warn(`Unknown type: "${type}"`)
    return
  }

  const Provider = (() => {
    if (type.startsWith("Twitter")) {
      return OAuth1Provider
    }
    return OAuth2Provider
  })()

  const provider = new Provider(config)

  const options = Object.assign({
    show: false,
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  let window = new BrowserWindow(options)
  window.once("ready-to-show", () => {
    window.show()
  })
  window.once("closed", () => {
    window = null
  })

  provider
    .perform(window)
    .then(resp => {
      window.close()
      console.log("Got response (◍•ᴗ•◍):", resp)
    })
    .catch(error => console.error(error))
})

process.on("uncaughtException", error => console.error(error))
