import { BrowserWindow } from "electron"
import {
  authorizationCodeFlowTask,
  implicitFlowTask,
  resourceOwnerPasswordCredentialsFlowTask,
  clientCredentialsFlowTask,
} from "./helper"
import { OAuthConfigType, WindowOptions } from "../"
import { OAuth2EmitterType } from "."

export type TaskFunction<C> = (
  config: C,
  ee: OAuth2EmitterType,
  window?: BrowserWindow,
  windowOptions?: WindowOptions,
) => Promise<any>

export const flowTaskFor = (config: OAuthConfigType): TaskFunction<any> => {
  const type = config.response_type || config.grant_type || "code"
  if (type === "code") {
    return authorizationCodeFlowTask
  } else if (type === "token") {
    return implicitFlowTask
  } else if (type === "password") {
    return resourceOwnerPasswordCredentialsFlowTask
  } else if (type === "client_credentials") {
    return clientCredentialsFlowTask
  }
  throw new Error(`Unsupported type: ${type}`)
}
