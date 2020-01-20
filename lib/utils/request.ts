import electron from "electron"
const { net } = electron

export type ResponseType = {
  headers: object
  statusCode: number
  statusMessage: string
  body: string
}

export const postRequest = (
  options: any,
  data?: string,
): Promise<ResponseType> => {
  return new Promise((resolve, reject) => {
    const ops = { ...options } // clone
    const headers = ops.headers || {}
    // Not allowed to set Content-Length in electron v7.1.2 and later on
    // headers["Content-Length"] = data ? Buffer.byteLength(data) : 0
    headers["Content-Type"] = "application/x-www-form-urlencoded"

    const request = net.request({ ...ops, headers, method: "POST" })

    request.on("response", response => {
      const datas: Buffer[] = []

      response.on("data", chunk => {
        datas.push(chunk)
      })

      response.on("end", () => {
        const body = Buffer.concat(datas)
        const resp = {
          headers: response.headers,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          body: body.toString(),
        }
        if (response.statusCode >= 400) {
          reject(
            new Error(
              `${resp.statusCode} - ${resp.statusMessage} : ${resp.body}`,
            ),
          )
          return
        }
        resolve(resp)
      })

      response.on("error", (error: Error) => {
        reject(error)
      })
    })

    if (data) {
      request.write(data, "utf8")
    }
    request.end()
  })
}
