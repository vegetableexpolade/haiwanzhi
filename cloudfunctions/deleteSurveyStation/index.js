const { cloud, db } = require('./common')
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  await db.collection('surveyStations').where({ _id: event.id, _openid: wxContext.OPENID }).remove()
  return { success: true }
}
