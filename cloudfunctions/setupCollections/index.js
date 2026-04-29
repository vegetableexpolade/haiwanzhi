const { db, requireAdmin } = require('./common')

const REQUIRED_COLLECTIONS = [
  'users',
  'loginCodes',
  'segmentCounters',
  'scoutSegments',
  'surveyStations'
]

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
    return { name, status: 'created' }
  } catch (e) {
    if (e.errCode === -502006 || (e.message && e.message.includes('ALREADY_EXISTS'))) {
      return { name, status: 'exists' }
    }
    return { name, status: 'error', message: e.message || String(e) }
  }
}

exports.main = async () => {
  await requireAdmin()
  const results = []
  for (const name of REQUIRED_COLLECTIONS) {
    results.push(await ensureCollection(name))
  }
  const failed = results.filter(r => r.status === 'error')
  return {
    success: failed.length === 0,
    results,
    message: failed.length
      ? `以下集合创建失败：${failed.map(r => r.name).join('、')}`
      : '所有集合已就绪'
  }
}
