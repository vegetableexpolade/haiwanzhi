const { db, withCollection } = require('./common')

async function sendWithTencentSms({ mobile, code }) {
  if (process.env.SMS_ENABLED !== 'true') {
    return { sent: false, mode: 'dev' }
  }
  const smsSdkAppId = process.env.SMS_SDKAPPID
  const signName = process.env.SMS_SIGN
  const templateId = process.env.SMS_TEMPLATE_ID
  const region = process.env.SMS_REGION || 'ap-guangzhou'
  if (!smsSdkAppId || !signName || !templateId) {
    throw new Error('短信环境变量未配置完整')
  }

  const tencentcloud = require('tencentcloud-sdk-nodejs')
  const SmsClient = tencentcloud.sms.v20210111.Client
  const client = new SmsClient({
    credential: {
      secretId: process.env.TENCENTCLOUD_SECRETID,
      secretKey: process.env.TENCENTCLOUD_SECRETKEY,
      token: process.env.TENCENTCLOUD_SESSIONTOKEN
    },
    region,
    profile: { httpProfile: { endpoint: 'sms.tencentcloudapi.com' } }
  })

  const resp = await client.SendSms({
    SmsSdkAppId: smsSdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code],
    PhoneNumberSet: [`+86${mobile}`],
    SessionContext: 'miniapp-login'
  })

  const status = (((resp || {}).SendStatusSet || [])[0] || {})
  if (status.Code && status.Code !== 'Ok') {
    throw new Error(status.Message || status.Code)
  }
  return { sent: true, mode: 'sms' }
}

exports.main = async (event) => {
  const { mobile } = event
  const userRes = await withCollection('users', () => db.collection('users').where({ mobile }).limit(1).get())
  const user = userRes.data[0]
  if (!user) return { success: false, message: '手机号未登记，请先注册' }
  if (!user.approved) return { success: false, message: '该用户尚未审批通过' }

  const latestRes = await withCollection('loginCodes', () => db.collection('loginCodes').where({ mobile }).orderBy('createdAt', 'desc').limit(1).get())
  const latest = latestRes.data[0]
  if (latest && (Date.now() - new Date(latest.createdAt).getTime()) < 60 * 1000) {
    return { success: false, message: '发送过于频繁，请稍后再试' }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  await db.collection('loginCodes').add({ data: { mobile, code, used: false, createdAt: new Date() } })

  try {
    const smsResult = await sendWithTencentSms({ mobile, code })
    if (smsResult.sent) return { success: true, sentMode: 'sms' }
  } catch (error) {
    return { success: false, message: `短信发送失败：${error.message}` }
  }

  return {
    success: true,
    sentMode: 'dev',
    devCode: code
  }
}
