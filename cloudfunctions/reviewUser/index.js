const { db, requireAdmin } = require('./common')

exports.main = async (event) => {
  await requireAdmin()
  const { id, approved = false, isAdmin = false, rejectReason = '' } = event || {}
  if (!id) return { success: false, message: '缺少用户ID' }
  await db.collection('users').doc(id).update({
    data: {
      approved: !!approved,
      isAdmin: !!approved && !!isAdmin,
      approvedAt: new Date(),
      rejectReason: approved ? '' : rejectReason,
      forceChangePassword: true
    }
  })
  return { success: true }
}
