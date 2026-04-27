const { authorize } = require('../../utils/permissions')
const { uploadPhotos } = require('../../utils/upload')
const { ensureRecordSize, normalizePhotos } = require('../../utils/image')
const { addLog } = require('../../utils/logger')
Page({
  data: { id: '', form: { stationNo: '', description: '', longitude: '', latitude: '', remark: '' }, photos: [] },
  onLoad(options) { if (options.id) { this.setData({ id: options.id }); this.loadDetail() } },
  async loadDetail() {
    const res = await wx.cloud.callFunction({ name: 'listSurveyStations', data: { id: this.data.id } })
    const row = (res.result.data || [])[0]
    if (row) this.setData({ form: { stationNo: row.stationNo, description: row.description, longitude: row.longitude, latitude: row.latitude, remark: row.remark || '' }, photos: row.photos || [] })
  },
  onInput(e) { this.setData({ [`form.${e.currentTarget.dataset.key}`]: e.detail.value }) },
  async getLocation() {
    try {
      await authorize('scope.userLocation', '需要定位权限')
      const res = await wx.getLocation({ type: 'wgs84' })
      this.setData({ 'form.longitude': Number(res.longitude).toFixed(6), 'form.latitude': Number(res.latitude).toFixed(6) })
    } catch (e) { wx.showToast({ title: '定位失败', icon: 'none' }) }
  },
  openMap() {
    const { latitude, longitude } = this.data.form
    if (!latitude || !longitude) return wx.showToast({ title: '请先获取定位', icon: 'none' })
    wx.openLocation({ latitude: Number(latitude), longitude: Number(longitude), scale: 18 })
  },
  async choosePhoto() {
    if (this.data.photos.length >= 5) return wx.showToast({ title: '最多允许5张照片', icon: 'none' })
    try {
      await authorize('scope.userLocation', '拍照时需要记录位置')
      const loc = await wx.getLocation({ type: 'wgs84' })
      const res = await wx.chooseMedia({ count: 5 - this.data.photos.length, mediaType: ['image'], sourceType: ['camera'] })
      const files = (res.tempFiles || []).map(item => ({ path: item.tempFilePath, latitude: Number(loc.latitude).toFixed(6), longitude: Number(loc.longitude).toFixed(6), takenAt: new Date().toISOString(), size: item.size || 0 }))
      const photos = await normalizePhotos(this.data.photos.concat(files), 5)
      this.setData({ photos })
    } catch (e) { wx.showToast({ title: '拍照失败', icon: 'none' }) }
  },
  deletePhoto(e) {
    const photos = this.data.photos.slice(); photos.splice(e.currentTarget.dataset.index, 1); this.setData({ photos })
  },
  async persist(showToast = true) {
    const { form, id } = this.data
    if (!form.stationNo) throw new Error('请填写站位编号')
    const textBytes = JSON.stringify(form).length * 2
    const tempPhotos = this.data.photos.filter(i => i.path)
    const cloudPhotos = this.data.photos.filter(i => !i.path)
    const optimized = tempPhotos.length ? await ensureRecordSize(tempPhotos, textBytes) : []
    const uploaded = optimized.length ? await uploadPhotos(optimized, `survey/${id || 'new'}/${form.stationNo}`) : []
    const payload = { ...form, photos: cloudPhotos.concat(uploaded), titleInfo: getApp().globalData.titleInfo }
    const res = await wx.cloud.callFunction({ name: 'saveSurveyStation', data: { id, payload } })
    this.setData({ id: res.result.id, photos: cloudPhotos.concat(uploaded) })
    addLog('填写现场调查', `${form.stationNo}`)
    if (showToast) wx.showToast({ title: '已保存' })
  },
  async saveStation() {
    wx.showLoading({ title: '保存中' })
    try { await this.persist(); wx.hideLoading() } catch (e) { wx.hideLoading(); wx.showToast({ title: e.message, icon: 'none' }) }
  },
  goBack() { wx.navigateBack() },
  async nextStation() {
    wx.showLoading({ title: '处理中' })
    try {
      if (this.data.form.stationNo) await this.persist(false)
      wx.hideLoading()
      wx.redirectTo({ url: '/pages/investigation-form/investigation-form' })
    } catch (e) { wx.hideLoading(); wx.showToast({ title: e.message, icon: 'none' }) }
  }
})
