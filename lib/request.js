const querystring = require("querystring")
const { net } = require("electron")

/**
 *
 * @param {string} url
 * @param {object} parameter
 * @returns {Promise<object>}
 */
const postRequest = (url, parameter) => {

  return new Promise((resolve, reject) => {

    const postData = querystring.stringify(parameter)

    const request = net.request({
      url,
      method: "POST",
      headers: {
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

module.exports = {
  postRequest
}