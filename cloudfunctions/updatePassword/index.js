const { db, getCurrentUser } = require('./common')
exports.main = async (event) => {
  const { password } = event
  if (!password || String(password).length < 6) return { success: false, message: '密码至少6位' }
  const { user } = await getCurrentUser()
  if (!user) return { success: false, message: '当前用户不存在' }
  await db.collection('users').doc(user._id).update({ data: { password, forceChangePassword: false, passwordUpdatedAt: new Date() } })
  return { success: true }
}
