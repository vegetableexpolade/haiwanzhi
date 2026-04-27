function pad(num) {
  return String(num).padStart(2, '0')
}
function formatSegmentDate(date = new Date()) {
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  return `${y}${m}${d}`
}
function formatDisplayTime(date = new Date()) {
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}年${m}月${d}日 ${hh}:${mm}`
}
function formatDateLine(date = new Date()) {
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  return `${y}-${m}-${d}`
}
function formatDateTimeLine(date = new Date()) {
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}
module.exports = { pad, formatSegmentDate, formatDisplayTime, formatDateLine, formatDateTimeLine }
