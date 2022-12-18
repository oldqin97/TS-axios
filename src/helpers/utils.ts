const toString = Object.prototype.toString

/**
 * is 关键字
 * 如果返回true 那么知道这个val是Date对象,可以. 到相应的属性
 */

/**
 * 是否是Date对象
 * @param {unknown} val
 * @returns {boolean}
 */
export function isDate(val: unknown): val is Date {
  return toString.call(val) === '[object Date]'
}

/**
 * 是否是Object isObject 的判断方式，对于 FormData、ArrayBuffer 这些类型，isObject 判断也为 true
 * @param {unknown} val
 * @returns {boolean}
 */
export function isObject(val: unknown): val is Object {
  return val !== null && typeof val === 'object'
}

/**
 * 是否是Object
 * @param {any} val
 * @returns {any}
 */
export function isPlainObject(val: unknown): val is Object {
  return toString.call(val) === '[object Object]'
}
