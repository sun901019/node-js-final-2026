// 共用驗證工具：之後每個 controller 驗欄位都從這裡拿
const isValidString = (value) =>
  typeof value === 'string' && value.trim().length > 0

const isValidInteger = (value) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

// ✚【原本缺少，補上】isValidPassword
// 為什麼需要：controllers/users.js 有 import { isValidPassword }，但這個檔案原本沒有它，
// 解構出來會是 undefined，一呼叫 isValidPassword(...) 就會 TypeError 直接 500。
// 規則（Swagger）：至少 1 個小寫、1 個大寫、1 個數字，只允許英數，長度 8~16。
// regex 拆解：
//   (?=.*[a-z])  → 「往後看」必須存在小寫字母（lookahead，不消耗字元）
//   (?=.*[A-Z])  → 必須存在大寫字母
//   (?=.*\d)     → 必須存在數字
//   [A-Za-z\d]{8,16} → 整體只能是英數、共 8~16 個字
const isValidPassword = (value) =>
  typeof value === 'string' && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/.test(value)

// ✚【原本缺少，補上】isValidUrl
// M3 規格：profile_image_url / meeting_url 必須以 https 開頭（測試會用 http:// 打你，要擋下來）
const isValidUrl = (value) =>
  typeof value === 'string' && value.startsWith('https')

// ✚【原本缺少，補上】isValidUUID
// 為什麼需要：PostgreSQL 的 uuid 欄位收到「格式不合法」的字串（例如 "abc"）會直接丟資料庫錯誤，
// TypeORM 往上拋 → 變成 500。先用 regex 擋格式，查無資料才交給「找不到 → 400」的邏輯。
const isValidUUID = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

// ✚【補上】記得把新函式一起匯出，controller 才拿得到
module.exports = { isValidString, isValidInteger, isValidPassword, isValidUrl, isValidUUID }
