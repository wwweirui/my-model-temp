import request from '@/utils/request'

export async function queryProse(): Promise<any> {
  return request('/prose')
}

// 创建图片验证码
export function createImgCode(data: any): Promise<any> {
  const serializedData = Object.keys(data)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
  .join('&');
  return request.post('/account/verificationCode/createImgCode', serializedData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 校验短信验证码输入错误次数是否超过限制
export function validateSmsCodeOutLimit(data: any): Promise<any> {
  return request.post('/account/verificationCode/validateSmsCodeOutLimit', data)
}

// 发送短信验证码
export function sendSms(data: any): Promise<any> {
  return request.post('/account/verificationCode/sendSms', data)
}

// 私募管理人大赛参赛报名
export function register(data: any): Promise<any> {
  return request.post(`/ptrs/competition/register`, data)
}


// 验证手机号、短信验证码、图形验证码
export function validPhoneCode(data: any): Promise<any> {
  return request.post('/account/verificationCode/check', data)
}

// 获取机构信息
export function institution(params: any): Promise<any> {
   return request.get(`/ptrs/competition/institution`, { params })
} 

// 获取产品信息
export function competitionProducts(params: any): Promise<any> {
  return request.get(`/ptrs/competition/products`, { params })
} 

// 获取推荐人信息
export function referrer(params: any): Promise<any> {
  return request.get(`/ptrs/competition/referrer`, { params })
} 

// 获取数据字典-策略组别
export function getDictByKey(): Promise<any> {
  return request.get(`/ptrs/dict/getDictByKey`)
} 

