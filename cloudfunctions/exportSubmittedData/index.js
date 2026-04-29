const { cloud, db, _, requireAdmin, formatDate, isCollectionMissingError } = require('./common')
const XLSX = require('xlsx')
const LEGACY_COASTLINE_KEY = 'coastline'

function normalizePhotos(photos = []) {
  return (photos || []).map((p, idx) => ({
    index: idx + 1,
    fileID: p.fileID || '',
    cloudPath: p.cloudPath || '',
    longitude: p.longitude || '',
    latitude: p.latitude || '',
    takenAt: p.takenAt ? formatDate(p.takenAt) : ''
  }))
}

function typeLabel(typeKey) {
  return {
    geomorphology: '海岸地貌类型',
    shoreline: '海岸线类型',
    seaUse: '海域使用现状',
    tidal: '潮间带类型',
    landUse: '土地利用现状'
  }[typeKey] || typeKey
}

function joinPhotos(photoRows) {
  return photoRows
    .map((p) => `${p.index}. ${p.fileID} | ${p.longitude},${p.latitude} | ${p.takenAt}`)
    .join('\n')
}

function putPhotoColumns(target, photos = []) {
  const rows = normalizePhotos(photos)
  target['照片数量'] = rows.length
  target['照片汇总'] = joinPhotos(rows)
  for (let i = 0; i < 5; i += 1) {
    const photo = rows[i] || {}
    const n = i + 1
    target[`照片${n}文件ID`] = photo.fileID || ''
    target[`照片${n}云路径`] = photo.cloudPath || ''
    target[`照片${n}经度`] = photo.longitude || ''
    target[`照片${n}纬度`] = photo.latitude || ''
    target[`照片${n}拍摄时间`] = photo.takenAt || ''
  }
  return target
}

function getTitleInfo(item = {}) {
  const titleInfo = item.titleInfo || {}
  return {
    bayName: item.bayName || titleInfo.bayName || '',
    timeText: item.timeText || titleInfo.timeText || '',
    recorder: item.recorder || titleInfo.recorder || ''
  }
}

function getSubmitStatus(item = {}) {
  return item.submitted ? '已提交' : '草稿'
}

function normalizeEntries(entries = {}) {
  const legacy = entries[LEGACY_COASTLINE_KEY]
  if (legacy && entries.shoreline) {
    const merged = { ...entries.shoreline }
    Object.keys(legacy).forEach((key) => {
      if (merged[key] === undefined || merged[key] === '') {
        merged[key] = legacy[key]
      }
    })
    return { ...entries, shoreline: merged }
  }
  if (legacy && !entries.shoreline) {
    return { ...entries, shoreline: legacy }
  }
  return entries
}

function createScountSummaryRow(item) {
  const entries = item.entries || {}
  const titleInfo = getTitleInfo(item)
  const completed = Object.keys(entries).map((key) => typeLabel(key)).join('、')
  return {
    海湾名称: titleInfo.bayName,
    题名时间: titleInfo.timeText,
    填表人: titleInfo.recorder,
    岸段序号: item.segmentNo || '',
    已完成模块: completed || '',
    模块数量: Object.keys(entries).length,
    提交状态: getSubmitStatus(item),
    提交时间: item.submittedAt ? formatDate(item.submittedAt) : '',
    草稿创建时间: item.createdAt ? formatDate(item.createdAt) : ''
  }
}

function baseScoutRow(item, moduleName) {
  const titleInfo = getTitleInfo(item)
  return {
    海湾名称: titleInfo.bayName,
    时间: titleInfo.timeText,
    填表人: titleInfo.recorder,
    岸段序号: item.segmentNo || '',
    填写模块: moduleName || '',
    备注: '',
    经度: '',
    纬度: '',
    提交状态: getSubmitStatus(item),
    提交时间: item.submittedAt ? formatDate(item.submittedAt) : '',
    草稿创建时间: item.createdAt ? formatDate(item.createdAt) : ''
  }
}

function createGeomorphologyRow(item, entry = {}) {
  const row = baseScoutRow(item, '海岸地貌类型')
  row['海岸地貌一级类'] = entry.primary || ''
  row['海岸地貌二级类'] = entry.secondary || ''
  row['备注'] = entry.remark || ''
  row['经度'] = entry.longitude || ''
  row['纬度'] = entry.latitude || ''
  return putPhotoColumns(row, entry.photos)
}

function createCoastlineRow(item, entry = {}) {
  const row = baseScoutRow(item, '海岸线类型')
  row['海岸线一级类'] = entry.primary || ''
  row['海岸线二级类'] = entry.secondary || ''
  row['备注'] = entry.remark || ''
  row['经度'] = entry.longitude || ''
  row['纬度'] = entry.latitude || ''
  return putPhotoColumns(row, entry.photos)
}

function createLandUseRow(item, entry = {}) {
  const row = baseScoutRow(item, '土地利用现状')
  row['土地利用一级类'] = entry.primary || ''
  row['土地利用二级类'] = entry.secondary || ''
  row['备注'] = entry.remark || ''
  row['经度'] = entry.longitude || ''
  row['纬度'] = entry.latitude || ''
  return putPhotoColumns(row, entry.photos)
}

function createSeaUseRow(item, entry = {}) {
  const row = baseScoutRow(item, '海域使用现状')
  row['海域使用一级类'] = entry.primary || ''
  row['海域使用二级类'] = entry.secondary || ''
  row['备注'] = entry.remark || ''
  row['经度'] = entry.longitude || ''
  row['纬度'] = entry.latitude || ''
  return putPhotoColumns(row, entry.photos)
}

function createTidalRow(item, entry = {}) {
  const zoneTypeMap = entry.zoneTypeMap || {}
  const row = baseScoutRow(item, '潮间带类型')
  row['高潮区类型'] = (zoneTypeMap['高潮区'] || []).join('、')
  row['中潮区类型'] = (zoneTypeMap['中潮区'] || []).join('、')
  row['低潮区类型'] = (zoneTypeMap['低潮区'] || []).join('、')
  row['潮间带选择汇总'] = Object.keys(zoneTypeMap).map((k) => `${k}:${(zoneTypeMap[k] || []).join('、')}`).join('；')
  row['备注'] = entry.remark || ''
  row['经度'] = entry.longitude || ''
  row['纬度'] = entry.latitude || ''
  return putPhotoColumns(row, entry.photos)
}

function createSurveyRow(item) {
  const titleInfo = getTitleInfo(item)
  const row = {
    海湾名称: titleInfo.bayName,
    时间: titleInfo.timeText,
    填表人: titleInfo.recorder,
    站位编号: item.stationNo || '',
    测站内容描述: item.description || '',
    备注: item.remark || '',
    经度: item.longitude || '',
    纬度: item.latitude || '',
    提交状态: getSubmitStatus(item),
    提交时间: item.submittedAt ? formatDate(item.submittedAt) : '',
    草稿创建时间: item.createdAt ? formatDate(item.createdAt) : ''
  }
  return putPhotoColumns(row, item.photos)
}

function rangeFilter(field, startDate, endDate) {
  if (!startDate && !endDate) return {}
  const start = startDate ? new Date(`${startDate}T00:00:00`) : null
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null
  if (start && end) return { [field]: _.gte(start).and(_.lte(end)) }
  if (start) return { [field]: _.gte(start) }
  return { [field]: _.lte(end) }
}

function buildFilter({ includeDraft, startDate, endDate }) {
  const submittedRange = rangeFilter('submittedAt', startDate, endDate)
  if (!includeDraft) return { submitted: true, ...submittedRange }
  if (!startDate && !endDate) return {}
  const draftRange = rangeFilter('createdAt', startDate, endDate)
  return _.or([
    { submitted: true, ...submittedRange },
    { submitted: false, ...draftRange }
  ])
}

async function listAll(collectionName, filter, orderField = 'createdAt') {
  let all = []
  let page = 0
  const pageSize = 100
  while (true) {
    let res
    try {
      const query = db.collection(collectionName).where(filter).orderBy(orderField, 'desc').skip(page * pageSize).limit(pageSize)
      res = await query.get()
    } catch (e) {
      if (isCollectionMissingError(e)) {
        break
      }
      throw e
    }
    const rows = res.data || []
    all = all.concat(rows)
    if (rows.length < pageSize) break
    page += 1
  }
  return all
}

function appendSheet(workbook, rows, sheetName) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
  XLSX.utils.book_append_sheet(workbook, ws, sheetName)
}

exports.main = async (event) => {
  await requireAdmin()
  const { kind = 'all', startDate = '', endDate = '', includeDraft = false } = event || {}
  const filter = buildFilter({ includeDraft, startDate, endDate })
  const orderField = includeDraft ? 'createdAt' : 'submittedAt'
  const workbook = XLSX.utils.book_new()
  let exportedSheets = 0
  let totalRows = 0

  if (kind === 'scout' || kind === 'all') {
    const scoutItems = await listAll('scoutSegments', filter, orderField)
    const normalizedScoutItems = scoutItems.map((item) => ({
      ...item,
      entries: normalizeEntries(item.entries || {})
    }))
    totalRows += normalizedScoutItems.length
    appendSheet(workbook, normalizedScoutItems.map(createScountSummaryRow), '踏勘总表')
    appendSheet(workbook, normalizedScoutItems.map((item) => createGeomorphologyRow(item, item.entries.geomorphology || {})), '海岸地貌类型')
    appendSheet(workbook, normalizedScoutItems.map((item) => createCoastlineRow(item, item.entries.shoreline || {})), '海岸线类型')
    appendSheet(workbook, normalizedScoutItems.map((item) => createSeaUseRow(item, item.entries.seaUse || {})), '海域使用现状')
    appendSheet(workbook, normalizedScoutItems.map((item) => createLandUseRow(item, item.entries.landUse || {})), '土地利用现状')
    appendSheet(workbook, normalizedScoutItems.map((item) => createTidalRow(item, item.entries.tidal || {})), '潮间带类型')
    exportedSheets += 6
  }

  if (kind === 'survey' || kind === 'all') {
    const surveyItems = await listAll('surveyStations', filter, orderField)
    totalRows += surveyItems.length
    appendSheet(workbook, surveyItems.map(createSurveyRow), '现场调查表')
    exportedSheets += 1
  }

  if (!exportedSheets) return { success: false, message: '未选择导出类型' }
  if (!totalRows) return { success: false, message: '没有可导出的数据，请确认筛选条件或先提交/包含草稿后再导出' }

  const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const cloudPath = `exports/现场数据导出_正式表头_${kind}_${stamp}.xlsx`
  const uploadRes = await cloud.uploadFile({ cloudPath, fileContent: fileBuffer })
  const tempRes = await cloud.getTempFileURL({ fileList: [uploadRes.fileID] })
  const temp = (tempRes.fileList || [])[0] || {}
  return {
    success: true,
    fileID: uploadRes.fileID,
    tempFileURL: temp.tempFileURL || '',
    cloudPath,
    kind,
    startDate,
    endDate,
    sheetCount: exportedSheets
  }
}
