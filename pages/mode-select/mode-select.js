Page({
  data: { isAdmin: false },
  onShow() {
    const user = getApp().globalData.user || wx.getStorageSync('currentUser') || {}
    this.setData({ isAdmin: !!user.isAdmin })
  },
  goScout() { wx.navigateTo({ url: '/pages/scout-home/scout-home' }) },
  goInvestigation() { wx.navigateTo({ url: '/pages/investigation-home/investigation-home' }) },
  goAdminApproval() { wx.navigateTo({ url: '/pages/admin-approval/admin-approval' }) },
  goAdminExport() { wx.navigateTo({ url: '/pages/admin-export/admin-export' }) },
  backTitle() { wx.navigateBack() }
})
