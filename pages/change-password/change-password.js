const { addLog } = require('../../utils/logger')
Page({
  data: { password: '', confirmPassword: '' },
  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [key]: e.detail.value })
  },
  async submit() {
    const { password, confirmPassword } = this.data
    if (!password || password.length < 6) return wx.showToast({ title: '密码至少6位', icon: 'none' })
    if (password !== confirmPassword) return wx.showToast({ title: '两次密码不一致', icon: 'none' })
    wx.showLoading({ title: '保存中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'updatePassword', data: { password } })
      wx.hideLoading()
      if (!res.result.success) throw new Error(res.result.message || '保存失败')
      const user = Object.assign({}, getApp().globalData.user || {}, { forceChangePassword: false })
      getApp().globalData.user = user
      wx.setStorageSync('currentUser', user)
      addLog('修改密码', '首次登录已修改密码')
      wx.reLaunch({ url: '/pages/title/title' })
    } catch (e) {
      wx.hideLoading()
      wx.showModal({ title: '保存失败', content: e.message || '请稍后重试', showCancel: false })
    }
  }
})
