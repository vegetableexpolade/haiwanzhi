const { statSize } = require('./image')

async function uploadPhotos(tempFiles, folder = 'scout') {
  const uploaded = []
  for (const item of tempFiles) {
    const ext = item.path.split('.').pop() || 'jpg'
    const cloudPath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const size = await statSize(item.path)
    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath: item.path,
      config: {
        env: getApp().globalData.envId
      }
    })
    uploaded.push({
      cloudPath,
      fileID: res.fileID,
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      takenAt: item.takenAt || new Date().toISOString(),
      size
    })
  }
  return uploaded
}
module.exports = { uploadPhotos }
