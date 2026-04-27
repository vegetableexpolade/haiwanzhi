function authorize(scope, content) {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope,
      success: resolve,
      fail: () => {
        wx.showModal({
          title: '需要授权',
          content,
          confirmText: '去设置',
          success: ({ confirm }) => {
            if (!confirm) return reject(new Error('用户拒绝授权'))
            wx.openSetting({
              success: (res) => {
                if (res.authSetting[scope]) resolve()
                else reject(new Error('未授予权限'))
              },
              fail: reject
            })
          }
        })
      }
    })
  })
}

async function ensureLoginPermissions() {
  await authorize('scope.userLocation', '需要开启位置权限，否则无法正常使用。')
  try {
    await authorize('scope.camera', '需要开启相机权限，否则无法现场拍照。')
  } catch (e) {}
  try {
    await authorize('scope.writePhotosAlbum', '建议开启相册权限，以便保存与管理照片。')
  } catch (e) {}
  return true
}

module.exports = {
  authorize,
  ensureLoginPermissions
}
