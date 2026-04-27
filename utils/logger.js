const { formatDateLine, formatDateTimeLine } = require('./segment')

function getLogKey(date = new Date()) {
  return `logs_${formatDateLine(date)}`
}

function addLog(action, detail = '') {
  const now = new Date()
  const key = getLogKey(now)
  const logs = wx.getStorageSync(key) || []
  logs.unshift({
    time: formatDateTimeLine(now),
    action,
    detail
  })
  wx.setStorageSync(key, logs.slice(0, 500))
}

function listLogDays() {
  const info = wx.getStorageInfoSync()
  return (info.keys || [])
    .filter(k => /^logs_\d{4}-\d{2}-\d{2}$/.test(k))
    .map(k => k.replace('logs_', ''))
    .sort((a, b) => a < b ? 1 : -1)
}

function getLogsByDay(day) {
  return wx.getStorageSync(`logs_${day}`) || []
}

module.exports = { addLog, listLogDays, getLogsByDay }
