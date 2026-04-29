const { cloud, db, pad, dateStr } = require('./common')

const COLLECTION_NOT_EXIST_CODE = -502006

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    if (e.errCode === COLLECTION_NOT_EXIST_CODE || (e.message && (e.message.includes('ALREADY_EXISTS') || e.message.includes('COLLECTION_EXIST')))) {
      return
    }
  }
}

exports.main = async (event) => {
  const { titleInfo } = event
  if (!titleInfo || !titleInfo.bayName) throw new Error('题名信息缺失')
  const wxContext = cloud.getWXContext()
  const today = new Date()
  const ds = dateStr(today)
  const key = `${titleInfo.bayName}-${ds}`

  await ensureCollection('segmentCounters')
  await ensureCollection('scoutSegments')

  const counterRes = await db.collection('segmentCounters').where({ key }).limit(1).get()
  let seq = 1
  if (counterRes.data.length) {
    const doc = counterRes.data[0]
    seq = Number(doc.seq || 0) + 1
    await db.collection('segmentCounters').doc(doc._id).update({ data: { seq, updatedAt: new Date() } })
  } else {
    await db.collection('segmentCounters').add({ data: { key, seq: 1, createdAt: new Date(), updatedAt: new Date() } })
    seq = 1
  }
  const segmentNo = `${titleInfo.bayName}-${ds}-ad${pad(seq)}`
  const res = await db.collection('scoutSegments').add({
    data: {
      bayName: titleInfo.bayName,
      recorder: titleInfo.recorder,
      titleInfo,
      dateStr: ds,
      segmentNo,
      entries: {},
      createdAt: new Date(),
      submitted: false,
      _openid: wxContext.OPENID
    }
  })
  return { id: res._id, segmentNo, success: true }
}
