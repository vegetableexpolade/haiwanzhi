const { cloud, db, formatDate } = require('./common')
const TYPE_KEYS = ['geomorphology', 'shoreline', 'seaUse', 'tidal', 'landUse']
exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const res = await db.collection('scoutSegments').where({ _openid: wxContext.OPENID, submitted: false }).orderBy('createdAt', 'desc').get()
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
