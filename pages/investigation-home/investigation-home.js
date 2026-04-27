const { addLog } = require('../../utils/logger')
Page({
  data: { stations: [] },
  onShow() { this.load() },
  async load() {
    const res = await wx.cloud.callFunction({ name: 'listSurveyStations' })
    this.setData({ stations: (res.result.data || []).map(i => ({ ...i, checked: false })) })
  },
  newStation() { wx.navigateTo({ url: '/pages/investigation-form/investigation-form' }) },
  openStation(e) { wx.navigateTo({ url: `/pages/investigation-form/investigation-form?id=${e.currentTarget.dataset.id}` }) },
  manageStations() { wx.navigateTo({ url: '/pages/investigation-manage/investigation-manage' }) },
  toggleChecked(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ stations: this.data.stations.map(i => i._id === id ? { ...i, checked: !i.checked } : i) })
  },
  async submitStations() {
    const ids = this.data.stations.filter(i => i.checked && !i.submitted).map(i => i._id)
    if (!ids.length) return wx.showToast({ title: '请先勾选待提交测站', icon: 'none' })
    wx.showModal({
      title: '确认提交', content: `将提交 ${ids.length} 个测站到云端。`,
      success: async ({ confirm }) => {
        if (!confirm) return
        wx.showLoading({ title: '提交中' })
        try {
          const res = await wx.cloud.callFunction({ name: 'submitSurveyStations', data: { ids } })
          if (!(res.result || {}).success) throw new Error('提交失败')
          addLog('提交现场调查', `提交 ${ids.length} 个测站`)
          wx.hideLoading(); wx.showToast({ title: '提交成功' }); this.load()
        } catch (e) {
          wx.hideLoading(); wx.showToast({ title: e.message || '提交失败', icon: 'none' })
        }
      }
    })
  }
})
