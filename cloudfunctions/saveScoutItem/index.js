const { cloud, db } = require('./common')
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { segmentId, typeKey, payload } = event
  const res = await db.collection('scoutSegments').where({ _id: segmentId, _openid: wxContext.OPENID }).limit(1).get()
  if (!res.data.length) throw new Error('岸段不存在')
  const segment = res.data[0]
  const entries = Object.assign({}, segment.entries || {}, { [typeKey]: payload })
  await db.collection('scoutSegments').doc(segmentId).update({ data: { entries, updatedAt: new Date() } })
  return { success: true }
}
