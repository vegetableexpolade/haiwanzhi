const { cloud, db } = require('./common')
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const ids = event.ids || []
  for (const id of ids) {
    await db.collection('surveyStations').where({ _id: id, _openid: wxContext.OPENID }).update({ data: { submitted: true, submittedAt: new Date() } })
  }
  return { success: true, count: ids.length }
}
