import { AxiosRequestConfig } from './types'

export default function xhr(config: AxiosRequestConfig) {
  const { data = null, url, method = 'GET', headers } = config

  const request = new XMLHttpRequest()

  request.open(method.toUpperCase(), url, true)

  Object.keys(headers).forEach(name => {
    // 当data不存在 但是又给了header的时候, 删除header的属性
    if (data === null && name.toLowerCase() === 'content-type') {
      delete headers[name]
    } else {
      // 设置header属性
      request.setRequestHeader(name, headers[name])
    }
  })

  request.send(data)
}
