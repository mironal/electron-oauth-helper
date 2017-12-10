
const {
  convertUsefulObject,
} = require("./request")
const post = require("./request").postRequest

const postRequest = (...args) => post(...args).then(convertUsefulObject)

const {
  awaitRedirect,
} = require("./redirect")

const {
  pick,
  omit,
} = require("./util")

module.exports = {
  postRequest,
  awaitRedirect,
  pick,
  omit,
}
