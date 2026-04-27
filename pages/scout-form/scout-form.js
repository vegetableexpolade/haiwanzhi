const { getOptionsByType, getTypeLabel, TIDAL_TYPES, TIDAL_ZONES } = require('../../utils/data')
const { authorize } = require('../../utils/permissions')
const { uploadPhotos } = require('../../utils/upload')
const { ensureRecordSize, normalizePhotos } = require('../../utils/image')
const { addLog } = require('../../utils/logger')

Page({
  data: {
    segmentId: '', typeKey: '', typeLabel: '', segment: {}, primaryOptions: [], secondaryOptions: [],
    primaryIndex: -1, secondaryIndex: -1, zoneIndex: -1, activeZone: '',
    form: { primary: '', secondary: '', latitude: '', longitude: '', remark: '', zoneTypeMap: {} },
    tidalZones: TIDAL_ZONES, tidalTypes: TIDAL_TYPES, selectedZoneTypes: {}, tidalSummary: '', photos: []
  },
  async onLoad(options) {
    const { segmentId, typeKey } = options
    this.setData({ segmentId, typeKey, typeLabel: getTypeLabel(typeKey) })
    const mapping = getOptionsByType(typeKey)
    this.setData({ primaryOptions: Object.keys(mapping) })
    await this.loadExisting()
  },
  async loadExisting() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getScoutSegmentStatus', data: { segmentId: this.data.segmentId } })
      const segment = res.result.data
      const existing = (segment.entries || {})[this.data.typeKey] || null
      const data = { segment, photos: (existing && existing.photos) || [] }
      if (existing) {
        if (this.data.typeKey === 'tidal') {
          const zoneTypeMap = existing.zoneTypeMap || {}
          const activeZone = Object.keys(zoneTypeMap)[0] || ''
          data.form = {
            latitude: existing.latitude || '', longitude: existing.longitude || '', remark: existing.remark || '', zoneTypeMap
          }
          data.activeZone = activeZone
          data.zoneIndex = activeZone ? this.data.tidalZones.indexOf(activeZone) : -1
          data.selectedZoneTypes = activeZone ? (zoneTypeMap[activeZone] || []).reduce((m, x) => (m[x] = true, m), {}) : {}
          data.tidalSummary = this.buildTidalSummary(zoneTypeMap)
        } else {
          const primaryOptions = this.data.primaryOptions
          const secondaryOptions = existing.primary ? (getOptionsByType(this.data.typeKey)[existing.primary] || []) : []
          data.primaryOptions = primaryOptions
          data.secondaryOptions = secondaryOptions
          data.primaryIndex = primaryOptions.indexOf(existing.primary)
          data.secondaryIndex = secondaryOptions.indexOf(existing.secondary)
          data.form = {
            primary: existing.primary || '',
            secondary: existing.secondary || '',
            latitude: existing.latitude || '',
            longitude: existing.longitude || '',
            remark: existing.remark || '',
            zoneTypeMap: {}
          }
        }
      }
      this.setData(data)
    } finally { wx.hideLoading() }
  },
  buildTidalSummary(zoneTypeMap = {}) {
    return Object.keys(zoneTypeMap).map(key => `${key}：${(zoneTypeMap[key] || []).join('、')}`).join('；')
  },
  onPrimaryChange(e) {
    const primaryIndex = Number(e.detail.value)
    const primary = this.data.primaryOptions[primaryIndex]
    const secondaryOptions = getOptionsByType(this.data.typeKey)[primary] || []
    this.setData({ primaryIndex, secondaryIndex: -1, secondaryOptions, 'form.primary': primary, 'form.secondary': '' })
  },
  onSecondaryChange(e) {
    const secondaryIndex = Number(e.detail.value)
    this.setData({ secondaryIndex, 'form.secondary': this.data.secondaryOptions[secondaryIndex] })
  },
  onRemarkInput(e) {
    this.setData({ 'form.remark': e.detail.value })
  },
  onZoneChange(e) {
    const zoneIndex = Number(e.detail.value)
    const activeZone = this.data.tidalZones[zoneIndex] || ''
    const arr = (this.data.form.zoneTypeMap[activeZone] || [])
    const selectedZoneTypes = arr.reduce((m, x) => (m[x] = true, m), {})
    this.setData({ zoneIndex, activeZone, selectedZoneTypes })
  },
  toggleTidalType(e) {
    if (!this.data.activeZone) return wx.showToast({ title: '请先选择潮滩分区', icon: 'none' })
    const value = e.currentTarget.dataset.value
    const selectedZoneTypes = Object.assign({}, this.data.selectedZoneTypes)
    selectedZoneTypes[value] = !selectedZoneTypes[value]
    const zoneTypeMap = Object.assign({}, this.data.form.zoneTypeMap)
    zoneTypeMap[this.data.activeZone] = Object.keys(selectedZoneTypes).filter(k => selectedZoneTypes[k])
    this.setData({
      selectedZoneTypes,
      'form.zoneTypeMap': zoneTypeMap,
      tidalSummary: this.buildTidalSummary(zoneTypeMap)
    })
  },
  async getLocation() {
    try {
      await authorize('scope.userLocation', '需要定位权限以记录经纬度')
      const res = await wx.getLocation({ type: 'wgs84' })
      this.setData({ 'form.latitude': Number(res.latitude).toFixed(6), 'form.longitude': Number(res.longitude).toFixed(6) })
    } catch (e) {
      wx.showToast({ title: '定位失败', icon: 'none' })
    }
  },
  openMap() {
    const { latitude, longitude } = this.data.form
    if (!latitude || !longitude) return wx.showToast({ title: '请先获取定位', icon: 'none' })
    wx.openLocation({ latitude: Number(latitude), longitude: Number(longitude), scale: 18 })
  },
  async choosePhoto() {
    if (this.data.photos.length >= 5) return wx.showToast({ title: '最多允许5张照片', icon: 'none' })
    try {
      await authorize('scope.userLocation', '拍照时需要定位权限以记录照片位置')
      const loc = await wx.getLocation({ type: 'wgs84' })
      const res = await wx.chooseMedia({ count: 5 - this.data.photos.length, mediaType: ['image'], sourceType: ['camera'] })
      const files = (res.tempFiles || []).map(item => ({ path: item.tempFilePath, latitude: Number(loc.latitude).toFixed(6), longitude: Number(loc.longitude).toFixed(6), takenAt: new Date().toISOString(), size: item.size || 0 }))
      const photos = await normalizePhotos(this.data.photos.concat(files), 5)
      this.setData({ photos })
    } catch (e) {
      wx.showToast({ title: '拍照失败', icon: 'none' })
    }
  },
  deletePhoto(e) {
    const photos = this.data.photos.slice()
    photos.splice(e.currentTarget.dataset.index, 1)
    this.setData({ photos })
  },
  async saveData() {
    const { typeKey, form, segmentId } = this.data
    if (typeKey === 'tidal') {
      const hasValue = Object.keys(form.zoneTypeMap || {}).some(k => (form.zoneTypeMap[k] || []).length)
      if (!hasValue) return wx.showToast({ title: '请完成潮间带选择', icon: 'none' })
    } else {
      if (!form.primary || !form.secondary) return wx.showToast({ title: '请选择一级类和二级类', icon: 'none' })
    }
    const textBytes = JSON.stringify(form).length * 2
    wx.showLoading({ title: '保存中' })
    try {
      const tempPhotos = this.data.photos.filter(i => i.path)
      const cloudPhotos = this.data.photos.filter(i => !i.path)
      const optimized = tempPhotos.length ? await ensureRecordSize(tempPhotos, textBytes) : []
      const uploaded = optimized.length ? await uploadPhotos(optimized, `scout/${segmentId}/${typeKey}`) : []
      const payload = typeKey === 'tidal'
        ? {
            zoneTypeMap: form.zoneTypeMap,
            remark: form.remark,
            latitude: form.latitude,
            longitude: form.longitude,
            photos: cloudPhotos.concat(uploaded)
          }
        : {
            primary: form.primary,
            secondary: form.secondary,
            remark: form.remark,
            latitude: form.latitude,
            longitude: form.longitude,
            photos: cloudPhotos.concat(uploaded)
          }
      const res = await wx.cloud.callFunction({ name: 'saveScoutItem', data: { segmentId, typeKey, payload } })
      wx.hideLoading()
      if (!res.result.success) throw new Error(res.result.message || '保存失败')
      addLog('填写现场踏勘', `${this.data.segment.segmentNo} / ${this.data.typeLabel}`)
      wx.showToast({ title: '保存成功' })
      setTimeout(() => wx.navigateBack(), 400)
    } catch (e) {
      wx.hideLoading(); wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    }
  },
  goBack() { wx.navigateBack() }
})
