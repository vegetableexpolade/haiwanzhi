const { SCOUT_TYPES } = require('../../utils/data')
Page({
  data: { segmentId: '', segment: {}, typeCards: [] },
  onLoad(options) {
    this.setData({ segmentId: options.segmentId || '' })
  },
  onShow() { this.loadDetail() },
  async loadDetail() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getScoutSegmentStatus', data: { segmentId: this.data.segmentId } })
      const segment = res.result.data
      const entries = segment.entries || {}
      const typeCards = SCOUT_TYPES.map(item => ({ ...item, done: !!entries[item.key] }))
      this.setData({ segment, typeCards })
    } finally { wx.hideLoading() }
  },
  openType(e) {
    const key = e.currentTarget.dataset.key
    const target = this.data.typeCards.find(i => i.key === key)
    if (target.done) {
      return wx.showModal({
        title: '已填写内容',
        content: '该内容已保存，是否继续修改？',
        success: ({ confirm }) => confirm && wx.navigateTo({ url: `/pages/scout-form/scout-form?segmentId=${this.data.segmentId}&typeKey=${key}` })
      })
    }
    wx.navigateTo({ url: `/pages/scout-form/scout-form?segmentId=${this.data.segmentId}&typeKey=${key}` })
  },
  goBack() { wx.navigateBack() }
})
