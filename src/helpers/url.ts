import { isDate, isObject } from './utils'

/**
 * 格式化字符
 * @param {string} val
 * @returns {string}
 */
function encode(val: string): string {
  return encodeURIComponent(val)
    .replace(/%40/g, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

/**
 * 对url params参数进行处理
 * @param {string} url
 * @param {any} params?
 * @returns {string}
 */
export function buildURL(url: string, params?: any) {
  if (!params) {
    return url
  }

  const parts: string[] = []

  Object.keys(params).forEach(key => {
    let val = params[key]

    // 过滤value为null或者undefined的属性添加到url中
    if (val === null || typeof val === 'undefined') return

    let values: string[]

    // 参数值为数组时,处理逻辑
    if (Array.isArray(val)) {
      values = val
      key += '[]'
    } else {
      values = [val]
    }

    values.forEach(val => {
      // 参数值为Date时,处理逻辑
      if (isDate(val)) {
        val = val.toISOString()
      } else if (isObject(val)) {
        // 参数值为Object时,处理逻辑
        val = JSON.stringify(val)
      }
      parts.push(`${encode(key)}=${encode(val)}`)
    })
  })
  let serializedParams = parts.join('&')

  if (serializedParams) {
    // url中有hash值时,过滤hash值
    const markIndex = url.indexOf('#')
    if (markIndex !== -1) {
      url = url.slice(0, markIndex)
    }
    // url中已有参数值,在url后添加新的参数
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }

  return url
}
