// 共用驗證工具：之後每個 controller 驗欄位都從這裡拿
const isValidString = (value) =>
  typeof value === 'string' && value.trim().length > 0

const isValidInteger = (value) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

module.exports = { isValidString, isValidInteger }
