const { db } = require('./common')
exports.main = async (event) => {
  await db.collection('users').doc(event.id).update({ data: { approved: !!event.approved, approvedAt: new Date() } })
  return { success: true }
}
