const { db, ensureCollection } = require('./common')
exports.main = async (event) => {
  await ensureCollection('users')
  await db.collection('users').doc(event.id).update({ data: { approved: !!event.approved, approvedAt: new Date() } })
  return { success: true }
}
