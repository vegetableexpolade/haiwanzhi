const { listLogDays, getLogsByDay } = require('../../utils/logger')
Page({
  data: { days: [], dayIndex: 0, currentDay: '', logs: [] },
  onShow() {
    const days = listLogDays()
    const currentDay = days[0] || ''
    this.setData({ days, currentDay, dayIndex: 0, logs: currentDay ? getLogsByDay(currentDay) : [] })
  },
  onDayChange(e) {
    const dayIndex = Number(e.detail.value)
    const currentDay = this.data.days[dayIndex] || ''
    this.setData({ dayIndex, currentDay, logs: currentDay ? getLogsByDay(currentDay) : [] })
  }
})
