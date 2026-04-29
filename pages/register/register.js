Page({
  data: {
    form: { mobile: '', company: '', name: '' },
    fields: [
      { key: 'mobile', label: '手机号码', placeholder: '请输入手机号码', type: 'number', maxlength: 11 },
      { key: 'company', label: '工作单位', placeholder: '请输入工作单位' },
      { key: 'name', label: '姓名', placeholder: '请输入姓名' }
    ]
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`form.${key}`]: e.detail.value.trim() })
  },
  async submitRegister() {
    const form = this.data.form
    if (!/^1\d{10}$/.test(form.mobile) || !form.company || !form.name) {
      return wx.showToast({ title: '请完整填写注册信息', icon: 'none' })
    }
    wx.showLoading({ title: '提交中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'register', data: form })
      const result = res.result || {}
      wx.hideLoading()
      if (!result.success) throw new Error(result.message || '提交失败')
      wx.showModal({
        title: '提交成功',
        content: result.message || '注册申请已提交，待后台审批后可登录。',
        showCancel: false,
        success: () => wx.navigateBack()
      })
    } catch (e) {
      wx.hideLoading()
      wx.showModal({ title: '提交失败', content: e.message || '请稍后再试', showCancel: false })
    }
  },
  goBack() { wx.navigateBack() }
})
