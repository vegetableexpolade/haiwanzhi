const { cloud, db } = require('./common')

async function ensureSurveyStations() {
  try {
    await db.createCollection('surveyStations')
  } catch (e) {}
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { id, payload } = event
  if (id) {
    await db.collection('surveyStations').doc(id).update({ data: { ...payload, updatedAt: new Date() } })
    return { success: true, id }
  }
  await ensureSurveyStations()
  const res = await db.collection('surveyStations').add({ data: { ...payload, _openid: wxContext.OPENID, submitted: false, createdAt: new Date() } })
  return { success: true, id: res._id }
}
