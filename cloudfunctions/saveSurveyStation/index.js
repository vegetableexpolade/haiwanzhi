const { cloud, db, ensureCollection } = require('./common')

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { id, payload } = event
  await ensureCollection('surveyStations')
  if (id) {
    await db.collection('surveyStations').doc(id).update({ data: { ...payload, updatedAt: new Date() } })
    return { success: true, id }
  }
  const res = await db.collection('surveyStations').add({ data: { ...payload, _openid: wxContext.OPENID, submitted: false, createdAt: new Date() } })
  return { success: true, id: res._id }
}
