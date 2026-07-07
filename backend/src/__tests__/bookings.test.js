// ─────────────────────────────────────────────
// 後端 API 測試：訂房路由
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'

vi.mock('../utils/prisma.js', () => ({
  default: {
    booking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import prisma from '../utils/prisma.js'

beforeEach(() => {
  vi.clearAllMocks()
})

const testToken = jwt.sign({ id: 'test-user-id' }, 'test-secret-for-vitest')

// ══════════════════════════════════════════════════════════════════════════
// GET /api/bookings — 取得我的訂單
// ══════════════════════════════════════════════════════════════════════════
describe('GET /api/bookings', () => {

  it('沒有帶 token 應該回 401', async () => {
    const res = await request(app).get('/api/bookings')

    expect(res.status).toBe(401)
    expect(prisma.booking.findMany).not.toHaveBeenCalled()
  })

  it('帶有效 token 應該回 200 並包含分頁結構', async () => {
    // 假裝 DB 有一筆訂單
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        listingId: 'listing-1',
        guestId: 'test-user-id',
        checkIn: '2025-08-10T00:00:00.000Z',
        checkOut: '2025-08-15T00:00:00.000Z',
        totalPrice: 12500,
        status: 'PENDING',
      },
    ])
    prisma.booking.count.mockResolvedValue(1)

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${testToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('bookings')
    expect(res.body).toHaveProperty('total', 1)
    expect(res.body).toHaveProperty('totalPages', 1)
  })

})

// ══════════════════════════════════════════════════════════════════════════
// POST /api/bookings — 建立訂單
// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/bookings', () => {

  it('沒有帶 token 應該回 401', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ listingId: 'abc', checkIn: '2025-08-10', checkOut: '2025-08-15', totalPrice: 5000 })

    expect(res.status).toBe(401)
    expect(prisma.booking.create).not.toHaveBeenCalled()
  })

  it('缺少必填欄位應該回 400', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({})  // 完全空的 body

    expect(res.status).toBe(400)
    expect(res.body.message).toBeTruthy()
    expect(prisma.booking.create).not.toHaveBeenCalled()
  })

  it('checkOut 早於 checkIn 應該回 400', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        listingId: 'listing-1',
        checkIn: '2025-08-15',    // 入住 15 號
        checkOut: '2025-08-10',   // 退房 10 號 ← 比入住還早，不合理
        totalPrice: 5000,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('checkOut 必須晚於 checkIn')
    expect(prisma.booking.create).not.toHaveBeenCalled()
  })

  it('日期格式錯誤應該回 400', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        listingId: 'listing-1',
        checkIn: 'not-a-date',    // 不合法的日期字串
        checkOut: 'also-not-a-date',
        totalPrice: 5000,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('日期格式不正確')
  })

  it('日期衝突應該回 400', async () => {
    // 假裝 DB 查到有衝突的訂單（findFirst 回傳一筆資料）
    prisma.booking.findFirst.mockResolvedValue({
      id: 'existing-booking',
      status: 'CONFIRMED',
    })

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        listingId: 'listing-1',
        checkIn: '2025-08-10',
        checkOut: '2025-08-15',
        totalPrice: 5000,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('該日期已被預訂，請選擇其他時段')
    // 衝突時不應該建立訂單
    expect(prisma.booking.create).not.toHaveBeenCalled()
  })

})
