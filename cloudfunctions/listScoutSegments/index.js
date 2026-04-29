const { cloud, db, formatDate } = require('./common')
const TYPE_KEYS = ['geomorphology', 'shoreline', 'seaUse', 'tidal', 'landUse']
exports.main = async () => {
  const wxContext = cloud.getWXContext()
  let res
  try {
    res = await db.collection('scoutSegments').where({ _openid: wxContext.OPENID, submitted: false }).orderBy('createdAt', 'desc').get()
  } catch (e) {
    if (e.errCode === -502006 || (e.message && e.message.includes('COLLECTION_NOT_EXIST'))) {
      return { data: [], error: '数据集合尚未建立，请联系管理员初始化数据库（调用 setupCollections）' }
    }
    throw e
  }
  return {
    data: res.data.map(item => {
      const entries = item.entries || {}
      const doneCount = TYPE_KEYS.filter(k => !!entries[k]).length
      return {
        ...item,
        createdAtText: formatDate(item.createdAt),
        statusText: item.submitted ? '已提交' : '未提交',
        canSubmit: true,
        progressText: `已完成 ${doneCount}/5 项`,
        photoCount: Object.keys(entries).reduce((sum, k) => sum + ((entries[k].photos || []).length), 0)
      }
    })
  }
}
