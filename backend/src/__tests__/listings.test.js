// ─────────────────────────────────────────────
// 後端 API 測試：房源路由
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'

vi.mock('../utils/prisma.js', () => ({
  default: {
    listing: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import prisma from '../utils/prisma.js'

beforeEach(() => {
  vi.clearAllMocks()
})

// 產生測試用 token
// jwt.sign(payload, secret) → 用 setup.js 裡設定的 JWT_SECRET 簽名
// authenticate middleware 驗證時也用同一個 secret，所以會通過
const testToken = jwt.sign({ id: 'test-user-id' }, 'test-secret-for-vitest')

// ══════════════════════════════════════════════════════════════════════════
// GET /api/listings — 取得房源列表
// ══════════════════════════════════════════════════════════════════════════
describe('GET /api/listings', () => {

  it('應該回 200 並包含分頁結構', async () => {
    // 設定假的 DB 回傳值
    // findMany 回傳假的房源陣列
    prisma.listing.findMany.mockResolvedValue([
      { id: 'listing-1', title: '台北套房', price: 2500, images: [], reviews: [] },
      { id: 'listing-2', title: '花蓮民宿', price: 1800, images: [], reviews: [] },
    ])
    // count 回傳總筆數
    prisma.listing.count.mockResolvedValue(2)

    const res = await request(app).get('/api/listings')

    expect(res.status).toBe(200)
    // 確認回傳的資料結構符合分頁格式
    expect(res.body).toHaveProperty('listings')
    expect(res.body).toHaveProperty('total', 2)
    expect(res.body).toHaveProperty('page', 1)
    expect(res.body).toHaveProperty('totalPages', 1)
    expect(res.body.listings).toHaveLength(2)
  })

  it('帶搜尋參數應該有傳遞給 DB 查詢', async () => {
    prisma.listing.findMany.mockResolvedValue([])
    prisma.listing.count.mockResolvedValue(0)

    // 打 GET /api/listings?location=台北
    await request(app).get('/api/listings?location=台北')

    // 確認 prisma.listing.findMany 有被呼叫（代表有進到 DB 查詢邏輯）
    expect(prisma.listing.findMany).toHaveBeenCalled()
  })

})

// ══════════════════════════════════════════════════════════════════════════
// POST /api/listings — 新增房源
// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/listings', () => {

  it('沒有帶 token 應該回 401', async () => {
    // 不帶 Authorization header，authenticate middleware 會擋
    const res = await request(app)
      .post('/api/listings')
      .send({ title: '測試房源', price: 2500 })

    expect(res.status).toBe(401)
    // 因為 auth middleware 就直接 return 了，不會到 validation，也不會打 DB
    expect(prisma.listing.create).not.toHaveBeenCalled()
  })

  it('帶 token 但缺少必填欄位應該回 400', async () => {
    // 帶有效 token，通過 auth，但送的資料缺少 description、location 等必填欄位
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ title: '只有標題' })  // 缺少 description、price 等

    expect(res.status).toBe(400)
    expect(res.body.message).toBeTruthy()
    // validation 失敗，不應該打 DB
    expect(prisma.listing.create).not.toHaveBeenCalled()
  })

  it('price 為負數應該回 400', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: '測試房源',
        description: '說明',
        price: -100,          // 負數，應該被擋
        location: '台北市',
        maxGuests: 2,
        category: '公寓',
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('price 必須大於 0')
  })

})
