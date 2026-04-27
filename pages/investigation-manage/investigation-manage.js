const { addLog } = require('../../utils/logger')
Page({
  data: { stations: [] },
  onShow() { this.load() },
  async load() {
    const res = await wx.cloud.callFunction({ name: 'listSurveyStations' })
    this.setData({ stations: res.result.data || [] })
  },
  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除', content: '删除后不可恢复。', success: async ({ confirm }) => {
      if (!confirm) return
      await wx.cloud.callFunction({ name: 'deleteSurveyStation', data: { id } })
      addLog('删除现场调查', id)
      wx.showToast({ title: '已删除' })
      this.load()
    } })
  }
})
