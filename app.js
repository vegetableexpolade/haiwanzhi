App({
  globalData: {
    envId: 'cloud1-3gajf6tm046ec7c5',
    user: null,
    titleInfo: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上基础库以支持云开发')
      return
    }
    wx.cloud.init({
      env: this.globalData.envId,
      traceUser: true
    })
    this.globalData.titleInfo = wx.getStorageSync('titleInfo') || null
    this.globalData.user = wx.getStorageSync('currentUser') || null
  }
})
