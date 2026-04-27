const { formatDisplayTime } = require('../../utils/segment')
const { addLog } = require('../../utils/logger')
Page({
  data: { bayName: '', recorder: '', currentTime: '' },
  onLoad() {
    const cache = wx.getStorageSync('titleInfo') || {}
    const user = getApp().globalData.user || {}
    this.setData({
      bayName: cache.bayName || '',
      recorder: cache.recorder || user.name || '',
      currentTime: formatDisplayTime(new Date())
    })
  },
  onShow() { this.setData({ currentTime: formatDisplayTime(new Date()) }) },
  onBayInput(e) { this.setData({ bayName: e.detail.value.trim() }) },
  onRecorderInput(e) { this.setData({ recorder: e.detail.value.trim() }) },
  saveAndNext() {
    if (!this.data.bayName || !this.data.recorder) return wx.showToast({ title: '请填写完整', icon: 'none' })
    const titleInfo = { bayName: this.data.bayName, recorder: this.data.recorder, timeText: this.data.currentTime }
    wx.setStorageSync('titleInfo', titleInfo)
    getApp().globalData.titleInfo = titleInfo
    addLog('题名填写', `${titleInfo.bayName} / ${titleInfo.recorder}`)
    wx.redirectTo({ url: '/pages/mode-select/mode-select' })
  },
  logout() {
    wx.removeStorageSync('currentUser')
    getApp().globalData.user = null
    addLog('退出登录', '用户主动退出')
    wx.reLaunch({ url: '/pages/login/login' })
  }
})
