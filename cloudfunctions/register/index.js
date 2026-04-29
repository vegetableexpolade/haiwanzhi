const { cloud, db, _ } = require('./common')
const MOBILE_PATTERN = /^1\d{10}$/
exports.main = async (event) => {
  const mobile = String(event.mobile || '').trim()
  const company = String(event.company || '').trim()
  const name = String(event.name || '').trim()
  if (!MOBILE_PATTERN.test(mobile) || !company || !name) {
    return { success: false, message: '请完整填写注册信息' }
  }
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''
  const conditions = [{ mobile }, { name, company }]
  if (openid) conditions.push({ _openid: openid })
  const existed = await db.collection('users').where(_.or(conditions)).limit(1).get()
  const user = existed.data[0]
  if (user) {
    if (user.approved) return { success: false, message: '该用户已通过审批，请直接登录' }
    await db.collection('users').doc(user._id).update({
      data: {
        mobile,
        company,
        name,
        _openid: openid || user._openid || '',
        registerSource: 'miniapp',
        rejectReason: '',
        updatedAt: new Date()
      }
    })
    return { success: true, message: '注册信息已更新，请等待审批' }
  }
  await db.collection('users').add({
    data: {
      mobile,
      company,
      name,
      approved: false,
      forceChangePassword: true,
      _openid: openid || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      registerSource: 'miniapp',
      rejectReason: ''
    }
  })
  return { success: true, message: '注册申请已提交，请等待审批' }
}
