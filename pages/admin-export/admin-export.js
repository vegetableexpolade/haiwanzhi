function downloadFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: resolve,
      fail: reject
    })
  })
}

function openDocument(filePath) {
  return new Promise((resolve, reject) => {
    wx.openDocument({
      filePath,
      showMenu: true,
      fileType: 'xlsx',
      success: resolve,
      fail: reject
    })
  })
}

Page({
  data: {
    kindOptions: [
      { label: '全部', value: 'all' },
      { label: '现场踏勘', value: 'scout' },
      { label: '现场调查', value: 'survey' }
    ],
    kindIndex: 0,
    startDate: '',
    endDate: '',
    includeDraft: true,
    downloadURL: '',
    lastFileID: ''
  },
  onLoad() {
    const user = getApp().globalData.user || wx.getStorageSync('currentUser') || {}
    if (!user.isAdmin) {
      wx.showModal({ title: '无权限', content: '仅管理员可访问该页面', showCancel: false, success: () => wx.navigateBack({ delta: 1 }) })
    }
  },
  onKindChange(e) { this.setData({ kindIndex: Number(e.detail.value) }) },
  onStartDateChange(e) { this.setData({ startDate: e.detail.value }) },
  onEndDateChange(e) { this.setData({ endDate: e.detail.value }) },
  onDraftToggle(e) { this.setData({ includeDraft: !!e.detail.value }) },
  async onExport() {
    const kind = this.data.kindOptions[this.data.kindIndex].value
    wx.showLoading({ title: '生成中' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'exportSubmittedData',
        data: {
          kind,
          startDate: this.data.startDate,
          endDate: this.data.endDate,
          includeDraft: this.data.includeDraft
        }
      })
      const result = res.result || {}
      if (!result.success) throw new Error(result.message || '导出失败')
      this.setData({ downloadURL: result.tempFileURL, lastFileID: result.fileID })
      if (!result.tempFileURL) throw new Error('未返回下载地址')
      const downloadRes = await downloadFile(result.tempFileURL)
      if (downloadRes.statusCode !== 200) throw new Error('下载失败')
      await openDocument(downloadRes.tempFilePath)
      wx.hideLoading()
      wx.showToast({ title: '导出完成', icon: 'success' })
    } catch (e) {
      wx.hideLoading()
      wx.showModal({ title: '导出失败', content: e.message || '请稍后再试', showCancel: false })
    }
  },
  copyLink() {
    if (!this.data.downloadURL) return
    wx.setClipboardData({ data: this.data.downloadURL })
  }
})
