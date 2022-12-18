import { isPlainObject } from './utils'

/**
 * 由于content-type不区分大小写,所有为了规范和美观,在这里对Content-Type进行格式化
 * @param {any} headers
 * @param {string} normalizedName
 * @returns {void}
 */
function normalizeHeaderName(headers: any, normalizedName: string) {
  if (!headers) return
  Object.keys(headers).forEach(name => {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = headers[name]
      delete headers[name]
    }
  })
}

export function processHeaders(headers: any, data: any) {
  normalizeHeaderName(headers, 'Content-Type')
  console.log('headers:', headers)

  // 当存在data 但是 又没有给header属性的时候
  if (isPlainObject(data)) {
    if (headers && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json;charset=utf-8'
    }
  }

  console.log('headers:', headers)
  return headers
}
