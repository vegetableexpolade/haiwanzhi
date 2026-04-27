const { db } = require('./common')
exports.main = async (event) => {
  const { mobile, company, name } = event
  const existed = await db.collection('users').where(db.command.or([{ mobile }, { name, company }])).limit(1).get()
  if (existed.data.length) return { success: false, message: '该用户已存在，请联系管理员审批或直接登录' }
  await db.collection('users').add({
    data: {
      mobile,
      company,
      name,
      approved: false,
      forceChangePassword: true,
      createdAt: new Date(),
      registerSource: 'miniapp'
    }
  })
  return { success: true }
}
