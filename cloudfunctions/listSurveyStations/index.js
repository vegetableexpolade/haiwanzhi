const { cloud, db, formatDate, isCollectionMissingError } = require('./common')
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const where = event && event.id ? { _id: event.id, _openid: wxContext.OPENID } : { _openid: wxContext.OPENID }
  let res
  try {
    res = await db.collection('surveyStations').where(where).orderBy('createdAt', 'desc').get()
  } catch (e) {
    if (isCollectionMissingError(e)) {
      return { data: [], error: '数据集合尚未建立，请联系管理员初始化数据库（调用 setupCollections）' }
    }
    throw e
  }
  return { data: res.data.map(item => ({ ...item, createdAtText: formatDate(item.createdAt), photoCountText: `照片${(item.photos || []).length}张` })) }
}
