// api.js - 基于 uni.request 的统一请求封装
import { handleLoginFailure } from '@/utils'
import { isWeixin } from '@/utils/util'
import { VUE_APP_API_URL } from '@/config'
import cookie from '@/utils/cookie'
import { replace } from '@/utils/router'

// 创建 request 函数容器
const request = {}

// 基础配置
const defaultOpt = { login: true }

// HTTP 方法集合
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']

// 请求拦截器（可扩展）
function requestInterceptor(options) {
  // 添加 baseURL
  if (!options.url.startsWith('http')) {
    options.url = VUE_APP_API_URL + options.url
  }

  // 设置默认 header
  options.header = {
    'Content-Type': 'application/json',
    ...options.header
  }

  // 登录态处理
  const token = cookie.get('accessToken')
  if (options.login !== false && token) {
    options.header.Authorization = 'Bearer ' + token
  }

  console.log('--> request token:', token)
  return options
}

// 响应拦截器
function responseInterceptor(res, resolve, reject) {
  const data = res.data || {}

  // #ifdef H5
  if (data.code === 1004004002) {
    if (isWeixin()) {
      const url = cookie.get('index_url') || `${location.origin}/h5/#/pages/index/index`
      console.log('redirect_uri:', url)
      location.href = url
      return
    }
  }
  // #endif

  // 状态码非 200
  if (res.statusCode !== 200) {
    uni.showToast({
      title: '请求失败',
      icon: 'none',
      duration: 2000,
    })
    return reject({ msg: '请求失败', res, data })
  }

  // 业务逻辑错误处理
  if (data.code === 401) {
    uni.hideLoading()
    handleLoginFailure()
    uni.showToast({
      title: data.msg || '未登录',
      icon: 'none',
      duration: 2000,
    })
    return reject({ msg: data.msg, res, data, toLogin: true })
  }

  if (data.code !== 0) {
    uni.showToast({
      title: data.msg || '请求异常',
      icon: 'none',
      duration: 2000,
    })
    return reject({ msg: data.msg, res, data })
  }

  // 成功
  return resolve(data.data, res)
}

// 通用请求方法
function baseRequest(options) {
  return new Promise((resolve, reject) => {
    // 构造请求参数
    const {
      url,
      method = 'GET',
      data = {},
      params = {},
      login = true,
      ...customOptions
    } = options

    let requestUrl = url
    let requestData = method.toUpperCase() === 'GET' ? params : data

    // 合并配置
    const reqConfig = requestInterceptor({
      url: requestUrl,
      method,
      data: requestData,
      ...customOptions,
      login // 控制是否携带 token
    })

    // 发起请求
    uni.request({
      url: reqConfig.url,
      method: reqConfig.method,
      data: reqConfig.data,
      header: reqConfig.header,
      success: (res) => {
        responseInterceptor(res, resolve, reject)
      },
      fail: (err) => {
        console.error('Network Error:', err)

        // 网络错误或超时
        if (err.errMsg.includes('network') || err.errMsg.includes('timeout')) {
          handleLoginFailure()
          return reject({ msg: '网络错误', toLogin: true })
        }

        reject({ msg: '请求失败', err })
      },
    })
  })
}

// 动态挂载 POST、PUT、PATCH
;['post', 'put', 'patch'].forEach((method) => {
  request[method] = (url, data = {}, options = {}) => {
    console.log('[Request]', url, data)
    return baseRequest({
      url,
      method: method.toUpperCase(),
      data,
      ...defaultOpt,
      ...options,
    })
  }
})

// 动态挂载 GET、DELETE、HEAD
;['get', 'delete', 'head'].forEach((method) => {
  request[method] = (url, params = {}, options = {}) => {
    return baseRequest({
      url,
      method: method.toUpperCase(),
      params,
      ...defaultOpt,
      ...options,
    })
  }
})

export default request