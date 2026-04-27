function formatDateText(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

Page({
  data: {
    tab: 'pending',
    users: []
  },
  onShow() {
    const user = getApp().globalData.user || wx.getStorageSync('currentUser') || {}
    if (!user.isAdmin) {
      return wx.showModal({
        title: '无权限',
        content: '仅管理员可访问该页面',
        showCancel: false,
        success: () => wx.navigateBack({ delta: 1 })
      })
    }
    this.loadUsers()
  },
  changeTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab }, () => this.loadUsers())
  },
  async loadUsers() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'listApprovalUsers',
        data: { tab: this.data.tab }
      })
      const rows = (res.result.data || []).map(item => ({
        ...item,
        createdAtText: formatDateText(item.createdAt),
        approvedAtText: formatDateText(item.approvedAt),
        tempReason: item.rejectReason || ''
      }))
      this.setData({ users: rows })
    } catch (e) {
      wx.showModal({ title: '加载失败', content: e.message || '请稍后再试', showCancel: false })
    } finally {
      wx.hideLoading()
    }
  },
  onReasonInput(e) {
    const { id } = e.currentTarget.dataset
    const value = e.detail.value
    const users = this.data.users.map(item => item._id === id ? { ...item, tempReason: value } : item)
    this.setData({ users })
  },
  onAdminSwitch(e) {
    const { id } = e.currentTarget.dataset
    const checked = !!e.detail.value
    const users = this.data.users.map(item => item._id === id ? { ...item, isAdmin: checked } : item)
    this.setData({ users })
  },
  getUserRow(id) {
    return this.data.users.find(item => item._id === id) || null
  },
  async approveUser(e) {
    const { id } = e.currentTarget.dataset
    const row = this.getUserRow(id)
    if (!row) return
    wx.showLoading({ title: '提交中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'reviewUser',
        data: { id, approved: true, isAdmin: !!row.isAdmin, rejectReason: '' }
      })
      if (!(res.result || {}).success) throw new Error((res.result || {}).message || '审批失败')
      wx.showToast({ title: '已通过', icon: 'success' })
      this.loadUsers()
    } catch (e2) {
      wx.showModal({ title: '审批失败', content: e2.message || '请稍后再试', showCancel: false })
    } finally {
      wx.hideLoading()
    }
  },
  async rejectUser(e) {
    const { id } = e.currentTarget.dataset
    const row = this.getUserRow(id)
    if (!row) return
    wx.showLoading({ title: '提交中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'reviewUser',
        data: {
          id,
          approved: false,
          isAdmin: false,
          rejectReason: row.tempReason || '管理员驳回'
        }
      })
      if (!(res.result || {}).success) throw new Error((res.result || {}).message || '驳回失败')
      wx.showToast({ title: '已驳回', icon: 'success' })
      this.loadUsers()
    } catch (e2) {
      wx.showModal({ title: '操作失败', content: e2.message || '请稍后再试', showCancel: false })
    } finally {
      wx.hideLoading()
    }
  }
})
