// ─────────────────────────────────────────────
// 測試環境初始化
// 每個測試檔案執行前都會先跑這裡
// ─────────────────────────────────────────────

// 設定測試用的環境變數
// 測試不連真實 DB，所以 DATABASE_URL 給假的
// JWT_SECRET 給固定值，讓我們可以自己產生測試用 token
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-for-vitest'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
