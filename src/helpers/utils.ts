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
 * 是否是Object
 * @param {unknown} val
 * @returns {boolean}
 */
export function isObject(val: unknown): val is Object {
  return val !== null && typeof val === 'object'
}
