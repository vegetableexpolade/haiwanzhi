const { cloud, db } = require('./common')
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const res = await db.collection('scoutSegments').where({ _id: event.segmentId, _openid: wxContext.OPENID }).limit(1).get()
  if (!res.data.length) throw new Error('岸段不存在')
  return { data: res.data[0] }
}
