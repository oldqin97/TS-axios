### 1. 初始化

#### 1.1 创建入口文件

```js
function axios(config /** config 隐含 any 报错 */) {}

export default axios
```

#### 1.2 定义 AxiosRequestConfig 接口类型

```js
export interface AxiosRequestConfig {
  url: string
  method?: Method
  data?: any
  params?: any
}
export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'Delete'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
```

```js
import { AxiosRequestConfig } from './types'

function axios(config: AxiosRequestConfig) {}

export default axios
```

#### 1.3 通过 XMLHttpRequest 发送请求

```js
import { AxiosRequestConfig } from './types'

export default function xhr(config: AxiosRequestConfig): void {
  const { data = null, url, method = 'get' } = config

  const request = new XMLHttpRequest()

  request.open(method.toUpperCase(), url, true)

  request.send(data)
}
```

#### 1.4 引入 xhr 模块

```js
import { AxiosRequestConfig } from './types'
import xhr from './xhr'

function axios(config: AxiosRequestConfig): void {
  xhr(config)
}

export default axios
```

#### 1.5 发送请求(examples/Simple/app.ts)

```js
import axios from '../../src/index'

axios({
  method: 'get',
  url: '/simple/get',
  params: {
    a: 1,
    b: 2
  }
})
```

```js
axios({
  method: 'get',
  url: '/base/get',
  params: {
    a: 1,
    b: 2
  }
})

router.get('/simple/get', function(req, res) {
  res.json({
    msg: `hello world`
  })
})
```

![get](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219011211.png)

![result](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219011233.png)

### 2. 处理请求 url 参数

希望最终请求的 `url` => `/base/get?a=1&b=2`, 这样服务端就可以通过请求的 url 解析 params 对象传递的参数, 本质上就是把 params 对象的 key 和 value 拼接到 url

**参数值为数组**

```js
axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: ['bar', 'baz']
  }
})
```

最终请求的 `url` 是 `/base/get?foo[]=bar&foo[]=baz'`。

**参数值为对象**

```js
axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: {
      bar: 'baz'
    }
  }
})
```

最终请求的 `url` 是 `/base/get?foo=%7B%22bar%22:%22baz%22%7D`，foo 后面拼接的是 {"bar":"baz"} encode 后的结果

**参数值为 Date 类型**

```js
const date = new Date()

axios({
  method: 'get',
  url: '/base/get',
  params: {
    date
  }
})
```

最终请求的 `url` 是 `/base/get?date=2019-04-01T05:55:39.030Z`，date 后面拼接的是 date.toISOString() 的结果。

**特殊字符支持**
对于字符 `@`、`:`、`$`、`,`、`space` ,`[`、`]`，我们是允许出现在 url 中的，不希望被 encode。

```js
axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: '@:$, '
  }
})
```

最终请求的 url 是 /base/get?foo=@:\$+，注意，我们会把空格 转换成 +

**空值忽略**

```js
axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: 'bar',
    baz: null
  }
})
```

对于值为 null 或者 undefined 的属性，我们是不会添加到 url 参数中的。
最终请求的 url 是 /base/get?foo=bar。

**丢弃 url 中的哈希标记**

```js
axios({
  method: 'get',
  url: '/base/get#hash',
  params: {
    foo: 'bar'
  }
})
```

最终请求的 url 是 /base/get?foo=bar

**保留 url 中已存在的参数**

```js
axios({
  method: 'get',
  url: '/base/get?foo=bar',
  params: {
    bar: 'baz'
  }
})
```

最终请求的 url 是 /base/get?foo=bar&bar=baz

#### 2.1 完整实现 buildURL

`helpers/url.ts`

```js
import { isDate, isObject } from './utils'

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
```

`helpers/utils.ts`

```js
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
```

**测试 demo**

```js
axios({
  method: 'get',
  url: '/simple/get',
  params: {
    a: 1,
    b: 2
  }
})

axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: ['bar', 'baz']
  }
})

axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: {
      bar: 'baz',
      q: {
        test: 'test'
      }
    }
  }
})

const date = new Date()

axios({
  method: 'get',
  url: '/base/get',
  params: {
    date
  }
})

axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: '@:$, '
  }
})

axios({
  method: 'get',
  url: '/base/get',
  params: {
    foo: 'bar',
    baz: null
  }
})

axios({
  method: 'get',
  url: '/base/get#hash',
  params: {
    foo: 'bar'
  }
})

axios({
  method: 'get',
  url: '/base/get?foo=bar',
  params: {
    bar: 'baz'
  }
})

router.get('/base/get', function(req, res) {
  res.json(req.query)
})
```

![params解析](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219021337.png)

### 3. 处理请求 body 数据

`XMLHttpRequest` 对象实例的 `send` 方法发送请求, 支持的参数`Document`,`BodyInit`类型, BodyInit 包括了 Blob, BufferSource, FormData, URLSearchParams, ReadableStream、USVString，当没有数据的时候，我们还可以传入 null。

```js
axios({
  method: 'post',
  url: '/base/post',
  data: {
    a: 1,
    b: 2
  }
})
```

这个 `data`是不能直接传给 send 函数的,需要转换成 JSON 字符串

#### 3.1 transformRequest 函数实现

`helpers/data.ts`

```ts
import { isPlainObject } from './util'

export function transformRequest(data: any): any {
  if (isPlainObject(data)) {
    return JSON.stringify(data)
  }
  return data
}
```

`helpers/util.js`

```ts
export function isPlainObject(val: any): val is Object {
  return toString.call(val) === '[object Object]'
}
```

这里为什么要使用 `isPlainObject` 函数判断，而不用之前的 `isObject` 函数呢，因为 `isObject` 的判断方式，对于 `FormData`、`ArrayBuffer` 这些类型，`isObject` 判断也为 true，但是这些类型的数据我们是不需要做处理的，而 `isPlainObject` 的判断方式，只有我们定义的普通 JSON 对象才能满足。

`index.ts`

```ts
import { transformRequest } from './helpers/data'

function processConfig(config: AxiosRequestConfig): void {
  config.url = transformURL(config)
  config.data = transformRequestData(config)
}

function transformRequestData(config: AxiosRequestConfig): any {
  return transformRequest(config.data)
}
```

**测试 demo**

`base/app.ts`

```ts
axios({
  method: 'post',
  url: '/base/post',
  data: {
    a: 1,
    b: 2
  }
})

const arr = new Int32Array([21, 31])
axios({
  method: 'post',
  url: '/base/buffer',
  data: arr
})
```

1. **post**

![post-send](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219034443.png)

![payload](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219034513.png)

![response](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219034522.png)

2. **buffer**

![buffer-send](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219034648.png)

![payload](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219034708.png)

![response](https://raw.githubusercontent.com/oldqin97/cloudImg/main/blogs/picture/20221219034716.png)

我们发现 /base/buffer 的请求是可以拿到数据，但是 base/post 请求的 response 里却返回的是一个空对象

实际上是因为我们虽然执行 send 方法的时候把普通对象 data 转换成一个 JSON 字符串，但是我们请求 header 的 Content-Type 是 text/plain;charset=UTF-8，导致了服务端接受到请求并不能正确解析请求 body 的数据

#### 3.2 添加请求 headers

`helpers/headers.ts`

```ts
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
```

header 属性是大小写不敏感的, 所有将 Content-Type 属性名格式化

`types/index.ts`

```ts
export interface AxiosRequestConfig {
  url: string
  method?: Method
  data?: any
  params?: any
  headers?: any
}
```

修改接口类型的定义,添加 headers 的可选属性

`index.ts`

```ts
import { processHeaders } from './helpers/headers'

function processConfig(config: AxiosRequestConfig): void {
  config.url = transformURL(config)
  config.headers = transformHeaders(config)
  config.data = transformRequestData(config)
}

function transformHeaders(config: AxiosRequestConfig) {
  const { headers = {}, data } = config
  return processHeaders(headers, data)
}
```

因为我们处理 header 依赖了 data, 所有在处理请求 body 数据之前处理请求 header

`xhr.ts`

```ts
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
```

当我们传入的 data 为空的时候，请求 header 配置 Content-Type 是没有意义的，于是我们把它删除。

**测试 demo**

```ts
axios({
  method: 'post',
  url: '/base/post',
  data: {
    a: 1,
    b: 2
  }
})

axios({
  method: 'post',
  url: '/base/post',
  headers: {
    'content-type': 'application/json;'
  },
  data: {
    a: 1,
    b: 2
  }
})

const paramsString = 'q=URLUtils.searchParams&topic=api'
const searchParams = new URLSearchParams(paramsString)

axios({
  method: 'post',
  url: '/base/post',
  data: searchParams
})
```

通过 demo 我们可以看到，当我们请求的数据是普通对象并且没有配置 headers 的时候，会自动为其添加 Content-Type:application/json;charset=utf-8；同时我们发现当 data 是某些类型如 URLSearchParams 的时候，浏览器会自动为请求 header 加上合适的 Content-Type。
