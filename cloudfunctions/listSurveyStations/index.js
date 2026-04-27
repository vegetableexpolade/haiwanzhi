const { cloud, db, formatDate } = require('./common')
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const where = event && event.id ? { _id: event.id, _openid: wxContext.OPENID } : { _openid: wxContext.OPENID }
  const res = await db.collection('surveyStations').where(where).orderBy('createdAt', 'desc').get()
  return { data: res.data.map(item => ({ ...item, createdAtText: formatDate(item.createdAt), photoCountText: `照片${(item.photos || []).length}张` })) }
}
