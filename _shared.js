const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
function formatDate(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function pad(num) { return String(num).padStart(2, '0') }
function dateStr(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}`
}
async function getCurrentUser() {
  const wxContext = cloud.getWXContext()
  if (!wxContext.OPENID) throw new Error('无法获取用户身份')
  const userRes = await db.collection('users').where({ _openid: wxContext.OPENID }).limit(1).get()
  const user = userRes.data[0] || null
  return { openid: wxContext.OPENID, user }
}
async function requireAdmin() {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('当前用户不存在')
  if (!user.isAdmin) throw new Error('仅管理员可执行此操作')
  return user
}
module.exports = { cloud, db, _, formatDate, pad, dateStr, getCurrentUser, requireAdmin }
