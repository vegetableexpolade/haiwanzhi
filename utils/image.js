function getFS() {
  return wx.getFileSystemManager()
}

function statSize(path) {
  return new Promise((resolve) => {
    try {
      getFS().stat({
        path,
        success: (res) => resolve(res.stats.size || 0),
        fail: () => resolve(0)
      })
    } catch (e) {
      resolve(0)
    }
  })
}

async function compressOne(path, quality = 70) {
  return new Promise((resolve) => {
    wx.compressImage({
      src: path,
      quality,
      success: (res) => resolve(res.tempFilePath || path),
      fail: () => resolve(path)
    })
  })
}

async function normalizePhotos(files, maxCount = 5) {
  const list = files.slice(0, maxCount)
  for (const item of list) {
    if (!item.size && item.path) item.size = await statSize(item.path)
  }
  return list
}

async function ensureRecordSize(photoList, textBytes = 0, maxBytes = 10 * 1024 * 1024) {
  let photos = await normalizePhotos(photoList)
  const total = () => photos.reduce((sum, i) => sum + Number(i.size || 0), 0) + textBytes
  if (total() <= maxBytes) return photos

  let qualities = [60, 45, 30, 20]
  for (const q of qualities) {
    for (const item of photos) {
      if (!item.path) continue
      const newPath = await compressOne(item.path, q)
      item.path = newPath
      item.size = await statSize(newPath)
    }
    if (total() <= maxBytes) return photos
  }
  return photos
}

module.exports = { statSize, normalizePhotos, ensureRecordSize }
