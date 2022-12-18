import { transformRequest } from './helpers/data'
import { buildURL } from './helpers/url'
import { AxiosRequestConfig } from './types'
import xhr from './xhr'

function axios(config: AxiosRequestConfig) {
  processConfig(config)
  xhr(config)
}

function processConfig(config: AxiosRequestConfig) {
  config.url = transformUrl(config)
  config.data = transformRequestData(config)
}

/**
 * 处理params
 * @param {AxiosRequestConfig} config
 * @returns {any}
 */
function transformUrl(config: AxiosRequestConfig) {
  const { url, params } = config
  return buildURL(url, params)
}

/**
 * 处理data(body)
 * @param {AxiosRequestConfig} config
 * @returns {any}
 */
function transformRequestData(config: AxiosRequestConfig) {
  return transformRequest(config.data)
}

export default axios
