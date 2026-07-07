// ─────────────────────────────────────────────
// 後端 API 測試：認證路由
// 工具：vitest（測試框架）+ supertest（打 HTTP 請求）
//
// supertest 的用法：
//   request(app).post('/api/auth/login').send({ ... })
//   → 不需要啟動 server，直接把 request 傳進 Express app
//   → 等同於真的打 API，但完全在 Node.js 記憶體裡跑
//
// vi.mock 的用法：
//   把 prisma 換成假的，讓測試不需要真的連資料庫
//   測試只管「這個情況下，我的程式碼會怎麼反應」
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'

// ── Mock Prisma ────────────────────────────────────────────────────────────
// vi.mock 會被 Vitest 自動「提升」到檔案最頂端執行（類似 import）
// 所以 prisma 的假實作在 app 被 import 之前就已經準備好
vi.mock('../utils/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),  // 假的 findUnique，預設回傳 undefined
      create: vi.fn(),
    },
  },
}))

// import 真實的 prisma mock（讓我們可以控制它在測試裡的回傳值）
import prisma from '../utils/prisma.js'

// ── 每個測試前重置 mock ─────────────────────────────────────────────────────
// 避免上一個測試的設定影響下一個測試
beforeEach(() => {
  vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════════════════
// POST /api/auth/register — 註冊
// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {

  it('欄位空白應該回 400', async () => {
    // 完全不送任何資料
    const res = await request(app)
      .post('/api/auth/register')
      .send({})

    // 驗證：HTTP status 必須是 400
    expect(res.status).toBe(400)
    // 驗證：回傳 body 要有 message 欄位
    expect(res.body.message).toBeTruthy()
    // Prisma 不應該被呼叫（驗證失敗就提早 return 了）
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('email 格式錯誤應該回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '王小明', email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email 格式不正確')
  })

  it('密碼少於 6 字元應該回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '王小明', email: 'user@example.com', password: '123' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('密碼至少需要 6 個字元')
  })

})

// ══════════════════════════════════════════════════════════════════════════
// POST /api/auth/login — 登入
// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {

  it('欄位空白應該回 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.message).toBeTruthy()
    // 驗證沒有打 DB（validation 失敗就提早 return）
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('找不到使用者應該回 400', async () => {
    // 讓假的 findUnique 回傳 null（代表 DB 裡沒有這個 email）
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email 或密碼錯誤')
    // 確認有打 DB 查詢（這次有通過 validation，所以會查 DB）
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'nobody@example.com' },
    })
  })

})

// ══════════════════════════════════════════════════════════════════════════
// GET /api/auth/me — 取得當前使用者
// ══════════════════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {

  it('沒有帶 token 應該回 401', async () => {
    // 不帶任何 Authorization header
    const res = await request(app).get('/api/auth/me')

    // 401 = Unauthorized（未認證）
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('未授權，請先登入')
  })

  it('帶錯誤的 token 應該回 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this-is-not-a-valid-jwt')

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Token 無效或已過期，請重新登入')
  })

})
