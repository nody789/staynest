// ─────────────────────────────────────────────
// 輸入驗證工具函式
// 讓每個路由在存資料庫前，先確認欄位合法
// ─────────────────────────────────────────────

// 檢查必填欄位是否都有值，缺一個就回傳錯誤訊息
// 全部通過回傳 null
// 用法：const err = requireFields(req.body, 'name', 'email')
//       if (err) return res.status(400).json({ message: err })
export function requireFields(body, ...fields) {
  for (const field of fields) {
    const val = body[field]
    if (val === undefined || val === null || String(val).trim() === '') {
      return `${field} 為必填欄位`
    }
  }
  return null
}

// 驗證 email 格式（基本格式：xxx@xxx.xxx）
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))
}

// 驗證數字是否大於 0（用於 price、totalPrice）
export function isPositiveNumber(val) {
  return typeof val === 'number' ? val > 0 : parseFloat(val) > 0
}

// 驗證日期字串是否合法
export function isValidDate(val) {
  if (!val) return false
  const d = new Date(val)
  return !isNaN(d.getTime())
}
