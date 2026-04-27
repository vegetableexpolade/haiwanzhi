const { ensureLoginPermissions } = require('../../utils/permissions')
const { addLog } = require('../../utils/logger')

Page({
  data: {
    mode: 'password',
    name: '',
    password: '',
    mobile: '',
    code: '',
    countdown: 0
  },
  timer: null,
  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [key]: e.detail.value.trim() })
  },
  startCountdown() {
    let countdown = 60
    this.setData({ countdown })
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      countdown -= 1
      if (countdown <= 0) {
        clearInterval(this.timer)
        this.timer = null
        this.setData({ countdown: 0 })
        return
      }
      this.setData({ countdown })
    }, 1000)
  },
  async sendCode() {
    if (!/^1\d{10}$/.test(this.data.mobile)) {
      return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    }
    wx.showLoading({ title: '发送中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'sendLoginCode',
        data: { mobile: this.data.mobile }
      })
      wx.hideLoading()
      if (!res.result.success) throw new Error(res.result.message || '发送失败')
      this.startCountdown()
      if (res.result.devCode) {
        wx.showModal({
          title: '开发测试验证码',
          content: `当前验证码：${res.result.devCode}`,
          showCancel: false
        })
      } else {
        wx.showToast({ title: '验证码已发送', icon: 'success' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showModal({ title: '发送失败', content: e.message || '请稍后再试', showCancel: false })
    }
  },
  async onLogin() {
    const { mode, name, password, mobile, code } = this.data
    if (mode === 'password' && (!name || !password)) return wx.showToast({ title: '请填写姓名和密码', icon: 'none' })
    if (mode === 'mobile' && (!/^1\d{10}$/.test(mobile) || !/^\d{6}$/.test(code))) return wx.showToast({ title: '请输入手机号和验证码', icon: 'none' })
    wx.showLoading({ title: '登录中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: mode === 'password' ? { mode, name, password } : { mode, mobile, code }
      })
      const result = res.result || {}
      if (!result.success) throw new Error(result.message || '登录失败')
      await ensureLoginPermissions()
      const app = getApp()
      app.globalData.user = result.user
      wx.setStorageSync('currentUser', result.user)
      addLog('登录', `${result.user.name || result.user.mobile} 登录成功`)
      wx.hideLoading()
      if (result.user.forceChangePassword) {
        return wx.reLaunch({ url: '/pages/change-password/change-password' })
      }
      wx.reLaunch({ url: '/pages/title/title' })
    } catch (e) {
      wx.hideLoading()
      wx.showModal({ title: '登录失败', content: e.message || '请检查登录信息', showCancel: false })
    }
  },
  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  }
})
