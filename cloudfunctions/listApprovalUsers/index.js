const { db, requireAdmin } = require('./common')

exports.main = async (event) => {
  await requireAdmin()
  const { tab = 'pending' } = event || {}
  const where = tab === 'pending' ? { approved: false } : {}
  const res = await db.collection('users').where(where).orderBy('createdAt', 'desc').limit(200).get()
  return { success: true, data: res.data || [] }
}
