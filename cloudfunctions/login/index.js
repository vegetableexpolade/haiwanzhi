const { cloud, db, ensureCollection } = require('./common')
exports.main = async (event) => {
  await ensureCollection('users')
  const { mode } = event
  if (mode === 'password') {
    const { name, password } = event
    if (name === 'test' && password === 'test1233') {
      return { success: true, user: { username: 'test', name: '测试用户', company: '测试单位', approved: true, testUser: true, forceChangePassword: false, isAdmin: false } }
    }
    const res = await db.collection('users').where({ name }).limit(1).get()
    const user = res.data[0]
    if (!user) return { success: false, message: '用户不存在，请先注册' }
    if (!user.approved) return { success: false, message: '用户尚未审批通过' }
    if (!user.password) return { success: false, message: '该账号尚未设置密码，请使用手机验证码登录' }
    if (user.password !== password) return { success: false, message: '密码错误' }
    const wxContext = cloud.getWXContext()
    if (!user._openid) await db.collection('users').doc(user._id).update({ data: { _openid: wxContext.OPENID, lastLoginAt: new Date() } })
    else await db.collection('users').doc(user._id).update({ data: { lastLoginAt: new Date() } })
    return { success: true, user: { _id: user._id, name: user.name, company: user.company, mobile: user.mobile, approved: true, forceChangePassword: !!user.forceChangePassword, isAdmin: !!user.isAdmin } }
  }

  if (mode === 'mobile') {
    await ensureCollection('loginCodes')
    const { mobile, code } = event
    const userRes = await db.collection('users').where({ mobile }).limit(1).get()
    const user = userRes.data[0]
    if (!user) return { success: false, message: '手机号未登记，请先注册' }
    if (!user.approved) return { success: false, message: '用户尚未审批通过' }
    const codeRes = await db.collection('loginCodes').where({ mobile, code, used: false }).orderBy('createdAt', 'desc').limit(1).get()
    const row = codeRes.data[0]
    if (!row) return { success: false, message: '验证码错误或已失效' }
    if ((Date.now() - new Date(row.createdAt).getTime()) > 5 * 60 * 1000) return { success: false, message: '验证码已过期' }
    await db.collection('loginCodes').doc(row._id).update({ data: { used: true, usedAt: new Date() } })
    const wxContext = cloud.getWXContext()
    await db.collection('users').doc(user._id).update({ data: { _openid: wxContext.OPENID, lastLoginAt: new Date() } })
    return { success: true, user: { _id: user._id, name: user.name, company: user.company, mobile: user.mobile, approved: true, forceChangePassword: !!user.forceChangePassword, isAdmin: !!user.isAdmin } }
  }
  return { success: false, message: '不支持的登录方式' }
}
