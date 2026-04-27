const { addLog } = require('../../utils/logger')
Page({
  data: { segments: [] },
  onShow() { this.loadSegments() },
  async loadSegments() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'listScoutSegments' })
      const segments = (res.result.data || []).map(item => ({ ...item, checked: false }))
      this.setData({ segments })
    } finally { wx.hideLoading() }
  },
  async createNew() {
    wx.showLoading({ title: '创建中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'createScoutSegment', data: { titleInfo: getApp().globalData.titleInfo } })
      addLog('新建岸段', res.result.segmentNo || '已创建')
      wx.hideLoading()
      wx.navigateTo({ url: `/pages/scout-entry-type/scout-entry-type?segmentId=${res.result.id}` })
    } catch (e) {
      wx.hideLoading(); wx.showToast({ title: e.message || '创建失败', icon: 'none' })
    }
  },
  toggleChecked(e) {
    const id = e.currentTarget.dataset.id
    const segments = this.data.segments.map(item => item._id === id ? { ...item, checked: !item.checked } : item)
    this.setData({ segments })
  },
  openLogs() {
    wx.navigateTo({ url: '/pages/logs/logs' })
  },
  openSegment(e) {
    wx.navigateTo({ url: `/pages/scout-entry-type/scout-entry-type?segmentId=${e.currentTarget.dataset.id}` })
  },
  async submitData() {
    const ids = this.data.segments.filter(i => i.checked).map(i => i._id)
    if (!ids.length) return wx.showToast({ title: '请先勾选待提交记录', icon: 'none' })
    wx.showModal({
      title: '确认提交',
      content: `将提交 ${ids.length} 条工作记录到云端。`,
      success: async ({ confirm }) => {
        if (!confirm) return
        wx.showLoading({ title: '提交中' })
        try {
          const res = await wx.cloud.callFunction({ name: 'submitScoutSegments', data: { ids } })
          if (!(res.result || {}).success) throw new Error('提交失败')
          addLog('提交现场踏勘', `提交 ${ids.length} 条岸段记录`)
          wx.hideLoading()
          wx.showToast({ title: '提交成功' })
          this.loadSegments()
        } catch (e) {
          wx.hideLoading(); wx.showToast({ title: e.message || '提交失败', icon: 'none' })
        }
      }
    })
  }
})
