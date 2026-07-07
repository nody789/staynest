// ─────────────────────────────────────────────
// 訂單路由 (Bookings Routes)
// 負責：查詢我的訂單、新增訂單、更新訂單狀態
// ─────────────────────────────────────────────
// 所有路由都需要登入（都有 authenticate middleware）
//
// 路由對應：
//   GET  /api/bookings     → 取得我的所有訂單
//   POST /api/bookings     → 建立新訂單
//   PUT  /api/bookings/:id → 更新訂單狀態（例如取消）

import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireFields, isValidDate, isPositiveNumber } from '../utils/validate.js'

const router = Router()

// ── 取得我的訂單（支援分頁）──────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { page, limit } = req.query
    const pageNum  = Math.max(1, parseInt(page)  || 1)
    const limitNum = Math.min(50, parseInt(limit) || 10)
    const skip     = (pageNum - 1) * limitNum

    // Promise.all 同時查資料和總筆數，用於計算總頁數
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { guestId: req.user.id },
        include: {
          listing: { select: { id: true, title: true, images: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where: { guestId: req.user.id } }),
    ])

    res.json({ bookings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 建立新訂單 ──────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, totalPrice } = req.body

    // 驗證必填欄位與合法值
    const fieldError = requireFields(req.body, 'listingId', 'checkIn', 'checkOut', 'totalPrice')
    if (fieldError) return res.status(400).json({ message: fieldError })
    if (!isValidDate(checkIn) || !isValidDate(checkOut)) return res.status(400).json({ message: '日期格式不正確' })
    if (new Date(checkIn) >= new Date(checkOut)) return res.status(400).json({ message: 'checkOut 必須晚於 checkIn' })
    if (!isPositiveNumber(totalPrice)) return res.status(400).json({ message: 'totalPrice 必須大於 0' })

    // 日期衝突檢查：確認同一房源在該時段沒有其他有效訂單
    // 邏輯：「現有訂單的入住日 ≤ 新的退房日」且「現有訂單的退房日 ≥ 新的入住日」= 有重疊
    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { not: 'CANCELLED' },  // 已取消的訂單不算衝突
        OR: [
          { checkIn: { lte: new Date(checkOut) }, checkOut: { gte: new Date(checkIn) } },
        ],
      },
    })
    if (conflict) return res.status(400).json({ message: '該日期已被預訂，請選擇其他時段' })

    const booking = await prisma.booking.create({
      data: {
        listingId,
        guestId: req.user.id,
        checkIn: new Date(checkIn),    // 字串轉 Date 物件
        checkOut: new Date(checkOut),
        totalPrice,
      },
    })
    res.status(201).json(booking)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 更新訂單狀態（例如取消）───────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } })
    if (!booking) return res.status(404).json({ message: '找不到訂單' })

    // 確認是本人的訂單才能修改
    if (booking.guestId !== req.user.id) return res.status(403).json({ message: '無權限' })

    // 只允許更新 status 欄位（PENDING / CONFIRMED / CANCELLED）
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 房東：取得我的房源收到的所有訂單（支援分頁）──
// 路由：GET /api/bookings/host
router.get('/host', authenticate, async (req, res) => {
  try {
    const { page, limit } = req.query
    const pageNum  = Math.max(1, parseInt(page)  || 1)
    const limitNum = Math.min(50, parseInt(limit) || 10)
    const skip     = (pageNum - 1) * limitNum

    const where = { listing: { hostId: req.user.id } }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true, images: true, location: true } },
          guest: { select: { id: true, name: true, avatar: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ])

    res.json({ bookings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── 房東：確認或拒絕訂單 ───────────────────────
// 路由：PUT /api/bookings/:id/host-action
// 和旅客取消不同，房東可以確認（CONFIRMED）或拒絕（CANCELLED）
router.put('/:id/host-action', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    })
    if (!booking) return res.status(404).json({ message: '找不到訂單' })

    // 確認操作者是該房源的房東
    if (booking.listing.hostId !== req.user.id) {
      return res.status(403).json({ message: '無權限' })
    }

    const { status } = req.body
    // 房東只能設定 CONFIRMED 或 CANCELLED
    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: '無效的狀態' })
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
