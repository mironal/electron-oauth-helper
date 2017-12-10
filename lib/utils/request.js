const querystring = require("querystring")
const net = require("electron").net

/**
 * @param {string} url
 * @param {object} parameter - post data
 * @param {object} headers
 * @returns {Promise<{statusCode: number, statusMessage: string, headers: object, body: Buffer}>}
 */
const postRequest = (url, parameter, headers) => {

  return new Promise((resolve, reject) => {

    const postData = querystring.stringify(parameter)

    const request = net.request({
      url,
      method: "POST",
      headers: Object.assign({}, {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData)
      }, headers || {})
    })

    request.on("response", response => {

      const datas = []

      response.on("data", chunk => {
        datas.push(chunk)
      })

      response.on("end", () => {
        const body = Buffer.concat(datas)
        const resp = {
          headers: response.headers,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          body: body,
        }
        resolve(resp)
      })

      response.on("error", error => {
        reject(error)
      })
    })

    request.write(postData, "utf8")
    request.end()
  })
}

/**
 * @param response {object}
 * @param response.headers {object}
 * @param response.statusCode {number}
 * @param response.statusMessage {string}
 *
 * @returns Promise<object>
 */
const convertUsefulObject = response => {

  response.body = response.body.toString("utf8")

  if (response.statusCode >= 400) {

    const error = new Error(`Error response: ${response.statusCode} - ${response.statusMessage}`)
    error.response = response
    return Promise.reject(error)
  }

  if (response.headers["content-type"].join(" ").includes("application/json")) {
    response.body = JSON.parse(response.body)
  }

  return response.body
}

module.exports = {
  convertUsefulObject,
  postRequest,
}
