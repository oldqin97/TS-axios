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
